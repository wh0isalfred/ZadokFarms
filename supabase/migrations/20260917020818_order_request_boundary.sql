-- Private retry receipts contain no customer contact details. The HMAC is made
-- by the server; knowledge of a human-readable reference grants no read access.
create table private.order_submission_keys (
  key uuid primary key,
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  receipt jsonb not null,
  created_at timestamptz not null default now()
);
create table private.order_submission_limits (
  bucket text primary key,
  expires_at timestamptz not null,
  attempts integer not null check (attempts > 0)
);
create index order_submission_limits_expiry_idx on private.order_submission_limits(expires_at);
alter table private.order_submission_keys enable row level security;
alter table private.order_submission_limits enable row level security;
revoke all on private.order_submission_keys, private.order_submission_limits from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert on private.order_submission_keys to service_role;
grant select, insert, update, delete on private.order_submission_limits to service_role;

create function private.protect_order_item_snapshot()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Order item snapshots cannot be deleted' using errcode = '23514';
  end if;
  if row(new.order_id, new.product_name, new.unit_price_ngn, new.selling_unit, new.quantity, new.created_at)
    is distinct from row(old.order_id, old.product_name, old.unit_price_ngn, old.selling_unit, old.quantity, old.created_at)
    or (new.product_id is distinct from old.product_id and new.product_id is not null) then
    raise exception 'Order item snapshots cannot be changed' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_order_item_snapshot() from public, anon, authenticated;
create trigger protect_order_item_snapshot before update or delete on public.order_items
for each row execute function private.protect_order_item_snapshot();

create function public.submit_order_request(p_key uuid, p_payload jsonb, p_fingerprint text, p_phone_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  saved private.order_submission_keys%rowtype;
  item jsonb;
  product public.products%rowtype;
  snapshots jsonb := '[]'::jsonb;
  customer_id uuid;
  order_id uuid;
  reference text;
  receipt jsonb;
  global_attempts integer;
  phone_attempts integer;
  quantity numeric;
begin
  if p_key is null or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$'
    or p_phone_hash is null or p_phone_hash !~ '^[a-f0-9]{64}$'
    or coalesce(jsonb_typeof(p_payload->'details'), '') <> 'object'
    or coalesce(jsonb_typeof(p_payload->'items'), '') <> 'array' then
    return jsonb_build_object('code', 'invalid_request');
  end if;
  if coalesce(char_length(p_payload#>>'{details,name}'), 0) not between 2 and 120
    or coalesce(p_payload#>>'{details,phone}', '') !~ '^\+[1-9][0-9]{6,14}$'
    or coalesce(p_payload#>>'{details,fulfilment}', '') not in ('pickup', 'delivery', 'to_confirm')
    or jsonb_array_length(p_payload->'items') not between 1 and 50 then
    return jsonb_build_object('code', 'invalid_request');
  end if;

  -- One short transaction lock coordinates limits and simultaneous retries across
  -- all instances. Suitable for the bounded public request workload (30/minute).
  perform pg_advisory_xact_lock(726334102);
  select * into saved from private.order_submission_keys where key = p_key;
  if found then
    if saved.fingerprint <> p_fingerprint then
      return jsonb_build_object('code', 'key_conflict');
    end if;
    return saved.receipt;
  end if;

  delete from private.order_submission_limits where expires_at < now() - interval '1 day';
  insert into private.order_submission_limits as limits (bucket, expires_at, attempts)
    values ('global', now() + interval '1 minute', 1)
    on conflict (bucket) do update set
      attempts = case when limits.expires_at <= now() then 1 else limits.attempts + 1 end,
      expires_at = case when limits.expires_at <= now() then now() + interval '1 minute' else limits.expires_at end
    returning attempts into global_attempts;
  if global_attempts > 30 then return jsonb_build_object('code', 'rate_limited'); end if;
  insert into private.order_submission_limits as limits (bucket, expires_at, attempts)
    values ('phone:' || p_phone_hash, now() + interval '15 minutes', 1)
    on conflict (bucket) do update set
      attempts = case when limits.expires_at <= now() then 1 else limits.attempts + 1 end,
      expires_at = case when limits.expires_at <= now() then now() + interval '15 minutes' else limits.expires_at end
    returning attempts into phone_attempts;
  if phone_attempts > 5 then return jsonb_build_object('code', 'rate_limited'); end if;

  if (select count(distinct value->>'slug') from jsonb_array_elements(p_payload->'items')) <> jsonb_array_length(p_payload->'items') then
    return jsonb_build_object('code', 'invalid_request');
  end if;
  -- Lock products and categories in a consistent order until snapshots are saved.
  perform p.id from public.products p join public.product_categories c on c.id = p.category_id
    where p.slug in (select value->>'slug' from jsonb_array_elements(p_payload->'items'))
    order by p.id for share of p, c;
  for item in select value from jsonb_array_elements(p_payload->'items') loop
    select p.* into product from public.products p join public.product_categories c on c.id = p.category_id
      where p.slug = item->>'slug' and p.published_at is not null
      and p.status in ('available', 'limited') and c.published;
    if not found or coalesce(jsonb_typeof(item->'expectedPrice'), '') <> 'number'
      or product.price_ngn::numeric is distinct from (item->>'expectedPrice')::numeric
      or product.name is distinct from item->>'expectedName'
      or product.selling_unit is distinct from item->>'expectedUnit' then
      return jsonb_build_object('code', 'catalogue_changed');
    end if;
    if coalesce(jsonb_typeof(item->'quantity'), '') <> 'number' then
      return jsonb_build_object('code', 'invalid_quantity');
    end if;
    quantity := (item->>'quantity')::numeric;
    if quantity not between 1 and 9999 or quantity <> trunc(quantity)
      or quantity < product.minimum_quantity or mod(quantity - product.minimum_quantity, product.quantity_step) <> 0 then
      return jsonb_build_object('code', 'invalid_quantity');
    end if;
    snapshots := snapshots || jsonb_build_array(jsonb_build_object(
      'product_id', product.id, 'name', product.name, 'unit', product.selling_unit,
      'price', product.price_ngn, 'quantity', quantity));
  end loop;

  insert into public.customers(full_name, phone)
    values (p_payload#>>'{details,name}', p_payload#>>'{details,phone}') returning id into customer_id;
  for attempt in 1..10 loop
    reference := 'ZF-' || to_char(now() at time zone 'Africa/Lagos', 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.order_requests(reference, customer_id, fulfilment_method)
      values (reference, customer_id, p_payload#>>'{details,fulfilment}')
      on conflict on constraint order_requests_reference_key do nothing returning id into order_id;
    exit when order_id is not null;
  end loop;
  if order_id is null then raise exception 'Reference allocation failed'; end if;
  insert into public.order_items(order_id, product_id, product_name, unit_price_ngn, selling_unit, quantity)
    select order_id, (value->>'product_id')::uuid, value->>'name', (value->>'price')::integer,
      value->>'unit', (value->>'quantity')::numeric from jsonb_array_elements(snapshots);
  insert into public.order_status_events(order_id, to_status) values (order_id, 'submitted');
  select jsonb_build_object('reference', reference, 'items', jsonb_agg(value - 'product_id'))
    into receipt from jsonb_array_elements(snapshots);
  insert into private.order_submission_keys(key, fingerprint, receipt) values (p_key, p_fingerprint, receipt);
  return receipt;
end;
$$;
revoke all on function public.submit_order_request(uuid, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.submit_order_request(uuid, jsonb, text, text) to service_role;
