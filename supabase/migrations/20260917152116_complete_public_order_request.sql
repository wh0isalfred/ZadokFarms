-- Forward correction: retain existing requests, receipts and the applied migration.
alter table public.order_requests add column delivery_address text;
alter table public.order_requests add column idempotency_key uuid unique;
alter table private.order_submission_keys add column payload_hash text
  check (payload_hash is null or payload_hash ~ '^[a-f0-9]{64}$');

-- Existing keys already identify accepted requests; no customer data is fabricated.
update public.order_requests as orders set idempotency_key = keys.key
from private.order_submission_keys as keys where orders.reference = keys.receipt->>'reference';

-- Fail explicitly if legacy delivery requests need a real address supplied first.
alter table public.order_requests add constraint order_requests_delivery_address_check
  check (fulfilment_method is distinct from 'delivery' or
    (delivery_address is not null and char_length(trim(delivery_address)) between 1 and 500));

create or replace function public.submit_order_request(p_key uuid, p_payload jsonb, p_fingerprint text, p_phone_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
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
  payload_hash text;
  phone_bucket text;
  suffix text;
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
begin
  if p_payload is null or octet_length(p_payload::text) > 16384 then
    return jsonb_build_object('code', 'invalid_request');
  end if;
  if p_key is null or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$'
    or p_phone_hash is null or p_phone_hash !~ '^[a-f0-9]{64}$'
    or coalesce(jsonb_typeof(p_payload->'details'), '') <> 'object'
    or coalesce(jsonb_typeof(p_payload->'items'), '') <> 'array' then
    return jsonb_build_object('code', 'invalid_request');
  end if;
  if coalesce(jsonb_typeof(p_payload#>'{details,name}'), '') <> 'string'
    or coalesce(jsonb_typeof(p_payload#>'{details,phone}'), '') <> 'string'
    or coalesce(char_length(trim(p_payload#>>'{details,name}')), 0) not between 2 and 120
    or coalesce(p_payload#>>'{details,phone}', '') !~ '^\+[1-9][0-9]{6,14}$'
    or coalesce(p_payload#>>'{details,fulfilment}', '') not in ('pickup', 'delivery', 'to_confirm')
    or jsonb_array_length(p_payload->'items') not between 1 and 50 then
    return jsonb_build_object('code', 'invalid_request');
  end if;

  if (p_payload#>>'{details,fulfilment}' = 'delivery' and
      (coalesce(jsonb_typeof(p_payload#>'{details,delivery_address}'), '') <> 'string'
       or coalesce(char_length(trim(p_payload#>>'{details,delivery_address}')), 0) not between 1 and 500))
    or (p_payload#>'{details,note}' is not null and
      (jsonb_typeof(p_payload#>'{details,note}') <> 'string' or char_length(p_payload#>>'{details,note}') > 500)) then
    return jsonb_build_object('code', 'invalid_request');
  end if;
  -- HMAC arguments are not authentication: anon can invoke this RPC directly.
  -- Bind new receipts to database-computed input, and derive phone limits here.
  payload_hash := encode(sha256(convert_to(p_payload::text, 'UTF8')), 'hex');
  phone_bucket := 'phone:' || encode(sha256(convert_to(p_payload#>>'{details,phone}', 'UTF8')), 'hex');

  -- One short transaction lock coordinates limits and simultaneous retries across
  -- all instances. Suitable for the bounded public request workload (30/minute).
  perform pg_advisory_xact_lock(726334102);
  select * into saved from private.order_submission_keys where key = p_key;
  if found then
    if saved.fingerprint <> p_fingerprint or (saved.payload_hash is not null and saved.payload_hash <> payload_hash) then
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
    values (phone_bucket, now() + interval '15 minutes', 1)
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
    if coalesce(jsonb_typeof(item), '') <> 'object'
      or coalesce(jsonb_typeof(item->'slug'), '') <> 'string'
      or coalesce(item->>'slug', '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      or char_length(item->>'slug') > 120
      or coalesce(jsonb_typeof(item->'expectedPrice'), '') <> 'number'
      or coalesce(jsonb_typeof(item->'expectedName'), '') <> 'string'
      or coalesce(jsonb_typeof(item->'expectedUnit'), '') <> 'string' then
      return jsonb_build_object('code', 'invalid_request');
    end if;
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
    values (trim(p_payload#>>'{details,name}'), p_payload#>>'{details,phone}') returning id into customer_id;
  for attempt in 1..10 loop
    suffix := '';
    for position in 1..6 loop
      suffix := suffix || substr(alphabet, 1 + floor(random() * char_length(alphabet))::integer, 1);
    end loop;
    reference := 'ZF-' || to_char(now() at time zone 'Africa/Lagos', 'YYYYMMDD') || '-' || suffix;
    insert into public.order_requests(reference, customer_id, fulfilment_method, idempotency_key, delivery_address, customer_note)
      values (reference, customer_id, p_payload#>>'{details,fulfilment}', p_key,
        case when p_payload#>>'{details,fulfilment}' = 'delivery' then trim(p_payload#>>'{details,delivery_address}') end,
        nullif(trim(p_payload#>>'{details,note}'), ''))
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
  insert into private.order_submission_keys(key, fingerprint, receipt, payload_hash) values (p_key, p_fingerprint, receipt, payload_hash);
  return receipt;
end;
$$;
revoke all on function public.submit_order_request(uuid, jsonb, text, text) from public, anon, authenticated, service_role;
grant execute on function public.submit_order_request(uuid, jsonb, text, text) to anon;
