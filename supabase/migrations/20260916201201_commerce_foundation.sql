create schema if not exists private;

create type public.staff_role as enum ('owner', 'admin', 'staff');
create type public.product_status as enum ('available', 'limited', 'unavailable', 'draft', 'archived');
create type public.inventory_adjustment_reason as enum (
  'harvest',
  'order_reserved',
  'reservation_released',
  'order_fulfilled',
  'spoilage',
  'correction',
  'physical_count'
);
create type public.order_status as enum (
  'submitted',
  'awaiting_availability',
  'partially_available',
  'confirmed',
  'awaiting_payment',
  'paid',
  'preparing',
  'ready',
  'fulfilled',
  'expired',
  'declined',
  'cancelled'
);

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role public.staff_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories(id),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  price_ngn integer not null check (price_ngn >= 0),
  price_prefix text check (price_prefix is null or char_length(price_prefix) <= 24),
  selling_unit text not null check (char_length(selling_unit) between 1 and 50),
  minimum_quantity numeric(12, 3) not null default 1 check (minimum_quantity > 0),
  quantity_step numeric(12, 3) not null default 1 check (quantity_step > 0),
  status public.product_status not null default 'draft',
  image_path text,
  image_alt text,
  featured boolean not null default false,
  display_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 30),
  email text,
  delivery_address text,
  internal_notes text,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^ZF-[0-9]{8}-[A-Z0-9]{4,8}$'),
  customer_id uuid not null references public.customers(id),
  status public.order_status not null default 'submitted',
  fulfilment_method text check (fulfilment_method in ('pickup', 'delivery', 'to_confirm')),
  wholesale boolean not null default false,
  customer_note text,
  internal_note text,
  requested_at timestamptz not null default now(),
  reservation_expires_at timestamptz,
  confirmed_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.order_requests(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price_ngn integer not null check (unit_price_ngn >= 0),
  selling_unit text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  confirmed_quantity numeric(12, 3) check (confirmed_quantity >= 0),
  created_at timestamptz not null default now()
);

create table public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.order_requests(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  note text,
  performed_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  quantity_delta numeric(12, 3) not null check (quantity_delta <> 0),
  reason public.inventory_adjustment_reason not null,
  note text,
  order_id uuid references public.order_requests(id) on delete set null,
  performed_by uuid references public.staff_profiles(id) on delete set null,
  idempotency_key text unique,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_public_catalogue_idx on public.products(status, display_order) where published_at is not null;
create index orders_customer_id_idx on public.order_requests(customer_id);
create index orders_status_requested_at_idx on public.order_requests(status, requested_at desc);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_status_events_order_id_idx on public.order_status_events(order_id, created_at desc);
create index inventory_adjustments_product_id_idx on public.inventory_adjustments(product_id, occurred_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger staff_profiles_set_updated_at before update on public.staff_profiles
for each row execute function private.set_updated_at();
create trigger product_categories_set_updated_at before update on public.product_categories
for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();
create trigger customers_set_updated_at before update on public.customers
for each row execute function private.set_updated_at();
create trigger order_requests_set_updated_at before update on public.order_requests
for each row execute function private.set_updated_at();

create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles
    where id = (select auth.uid())
      and active = true
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles
    where id = (select auth.uid())
      and active = true
      and role in ('owner', 'admin')
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_active_staff() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.is_active_staff() to authenticated;
grant execute on function private.is_admin() to authenticated;

create view public.product_inventory
with (security_invoker = true)
as
select
  p.id as product_id,
  coalesce(sum(a.quantity_delta), 0)::numeric(12, 3) as quantity_on_hand,
  max(a.occurred_at) as last_adjusted_at
from public.products p
left join public.inventory_adjustments a on a.product_id = p.id
group by p.id;

alter table public.staff_profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.inventory_adjustments enable row level security;

create policy "Public can view published categories"
on public.product_categories for select
to anon, authenticated
using (published = true or private.is_active_staff());

create policy "Public can view published products"
on public.products for select
to anon, authenticated
using (
  (published_at is not null and status in ('available', 'limited', 'unavailable'))
  or private.is_active_staff()
);

create policy "Public can view images for visible products"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (
        (p.published_at is not null and p.status in ('available', 'limited', 'unavailable'))
        or private.is_active_staff()
      )
  )
);

create policy "Staff can view their profile"
on public.staff_profiles for select
to authenticated
using (id = (select auth.uid()) or private.is_admin());

create policy "Admins manage staff profiles"
on public.staff_profiles for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Admins manage product categories"
on public.product_categories for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Active staff manage products"
on public.products for all
to authenticated
using (private.is_active_staff())
with check (private.is_active_staff());

create policy "Active staff manage product images"
on public.product_images for all
to authenticated
using (private.is_active_staff())
with check (private.is_active_staff());

create policy "Active staff view customers"
on public.customers for select
to authenticated
using (private.is_active_staff());

create policy "Active staff update customers"
on public.customers for update
to authenticated
using (private.is_active_staff())
with check (private.is_active_staff());

create policy "Active staff view order requests"
on public.order_requests for select
to authenticated
using (private.is_active_staff());

create policy "Active staff update order requests"
on public.order_requests for update
to authenticated
using (private.is_active_staff())
with check (private.is_active_staff());

create policy "Active staff view order items"
on public.order_items for select
to authenticated
using (private.is_active_staff());

create policy "Active staff view order status events"
on public.order_status_events for select
to authenticated
using (private.is_active_staff());

create policy "Active staff add order status events"
on public.order_status_events for insert
to authenticated
with check (private.is_active_staff());

create policy "Active staff view inventory adjustments"
on public.inventory_adjustments for select
to authenticated
using (private.is_active_staff());

create policy "Active staff append inventory adjustments"
on public.inventory_adjustments for insert
to authenticated
with check (private.is_active_staff() and performed_by = (select auth.uid()));

insert into public.product_categories (name, slug, display_order)
values
  ('Vegetables', 'vegetables', 10),
  ('Fruits', 'fruits', 20),
  ('Seedlings', 'seedlings', 30),
  ('Livestock', 'livestock', 40);

insert into public.products (
  category_id,
  name,
  slug,
  price_ngn,
  price_prefix,
  selling_unit,
  status,
  image_path,
  image_alt,
  display_order,
  published_at
)
select c.id, seed.name, seed.slug, seed.price_ngn, seed.price_prefix, seed.selling_unit,
  seed.status::public.product_status, seed.image_path, seed.name, seed.display_order, now()
from public.product_categories c
join (values
  ('vegetables', 'Habanero pepper', 'habanero', 4500, null, '5 kg', 'available', '/images/products/habanero.jpg', 10),
  ('vegetables', 'Bell pepper', 'bell-pepper', 6000, null, 'crate', 'available', '/images/products/bell-pepper.jpg', 20),
  ('vegetables', 'Cucumber', 'cucumber', 3200, null, '5 kg', 'available', '/images/products/cucumber.jpg', 30),
  ('vegetables', 'Tomatoes', 'tomatoes', 5500, null, 'basket', 'limited', '/images/products/tomatoes.jpg', 40),
  ('fruits', 'Watermelon', 'watermelon', 2500, null, 'piece', 'available', '/images/products/watermelon.jpg', 50),
  ('fruits', 'Plantain', 'plantain', 7500, null, 'bunch', 'available', '/images/products/plantain.jpg', 60),
  ('vegetables', 'Maize', 'maize', 18000, null, 'bag', 'limited', '/images/products/maize.jpg', 70),
  ('seedlings', 'Seedlings', 'seedlings', 500, 'From', 'seedling', 'unavailable', '/images/products/seedlings.jpg', 80),
  ('livestock', 'Snails', 'snails', 12000, null, '1 kg', 'available', '/images/products/snails.jpg', 90)
) as seed(category_slug, name, slug, price_ngn, price_prefix, selling_unit, status, image_path, display_order)
  on c.slug = seed.category_slug;
