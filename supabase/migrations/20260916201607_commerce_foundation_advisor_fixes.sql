create index inventory_adjustments_order_id_idx
on public.inventory_adjustments(order_id)
where order_id is not null;

create index inventory_adjustments_performed_by_idx
on public.inventory_adjustments(performed_by)
where performed_by is not null;

create index order_items_product_id_idx
on public.order_items(product_id)
where product_id is not null;

create index order_status_events_performed_by_idx
on public.order_status_events(performed_by)
where performed_by is not null;

drop policy "Admins manage staff profiles" on public.staff_profiles;
create policy "Admins add staff profiles"
on public.staff_profiles for insert
to authenticated
with check (private.is_admin());
create policy "Admins update staff profiles"
on public.staff_profiles for update
to authenticated
using (private.is_admin())
with check (private.is_admin());
create policy "Admins remove staff profiles"
on public.staff_profiles for delete
to authenticated
using (private.is_admin());

drop policy "Admins manage product categories" on public.product_categories;
create policy "Admins add product categories"
on public.product_categories for insert
to authenticated
with check (private.is_admin());
create policy "Admins update product categories"
on public.product_categories for update
to authenticated
using (private.is_admin())
with check (private.is_admin());
create policy "Admins remove product categories"
on public.product_categories for delete
to authenticated
using (private.is_admin());

drop policy "Active staff manage products" on public.products;
create policy "Active staff add products"
on public.products for insert
to authenticated
with check (private.is_active_staff());
create policy "Active staff update products"
on public.products for update
to authenticated
using (private.is_active_staff())
with check (private.is_active_staff());
create policy "Active staff remove products"
on public.products for delete
to authenticated
using (private.is_active_staff());

drop policy "Active staff manage product images" on public.product_images;
create policy "Active staff add product images"
on public.product_images for insert
to authenticated
with check (private.is_active_staff());
create policy "Active staff update product images"
on public.product_images for update
to authenticated
using (private.is_active_staff())
with check (private.is_active_staff());
create policy "Active staff remove product images"
on public.product_images for delete
to authenticated
using (private.is_active_staff());
