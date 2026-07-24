-- ============================================================
-- KHET Store v2 — Row Level Security Policies
-- Run AFTER supabase-schema.sql.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_usage enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.site_settings enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.admin_notifications enable row level security;

-- ---------- profiles ----------
create policy "read own profile or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "update own profile (role locked)" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = 'customer'); -- self-promotion impossible
create policy "admin updates profiles" on public.profiles
  for update using (public.is_admin());

-- ---------- catalog: public read, admin write ----------
create policy "public reads brands" on public.brands
  for select using (is_visible = true or public.is_admin());
create policy "admin manages brands" on public.brands
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads categories" on public.categories
  for select using (is_visible = true or public.is_admin());
create policy "admin manages categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads published products" on public.products
  for select using (status = 'published' or public.is_admin());
create policy "admin manages products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads colors of published" on public.product_colors
  for select using (
    public.is_admin() or
    exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy "admin manages colors" on public.product_colors
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads variants of published" on public.product_variants
  for select using (
    public.is_admin() or
    exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy "admin manages variants" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads images of published" on public.product_images
  for select using (
    public.is_admin() or
    exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy "admin manages images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads collections" on public.collections
  for select using (is_visible = true or public.is_admin());
create policy "admin manages collections" on public.collections
  for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads collection products" on public.collection_products
  for select using (true);
create policy "admin manages collection products" on public.collection_products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- carts / wishlists / addresses: owner only ----------
create policy "own cart" on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own cart items" on public.cart_items
  for all using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "own wishlist" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own wishlist items" on public.wishlist_items
  for all using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));

create policy "own addresses" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- coupons ----------
create policy "public reads active coupons" on public.coupons
  for select using (is_active = true or public.is_admin());
create policy "admin manages coupons" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());
create policy "users log own coupon usage" on public.coupon_usage
  for insert with check (auth.uid() = user_id);
create policy "read own or admin coupon usage" on public.coupon_usage
  for select using (auth.uid() = user_id or public.is_admin());

-- ---------- orders ----------
create policy "users create own orders" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "read own or admin orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "admin updates orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes orders" on public.orders
  for delete using (public.is_admin());

create policy "users create items for own orders" on public.order_items
  for insert with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "read own or admin order items" on public.order_items
  for select using (
    public.is_admin() or
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "users create payments for own orders" on public.payments
  for insert with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "read own or admin payments" on public.payments
  for select using (
    public.is_admin() or
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "admin updates payments" on public.payments
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- reviews ----------
create policy "public reads approved reviews" on public.reviews
  for select using (is_approved = true or public.is_admin() or auth.uid() = user_id);
create policy "users write own reviews" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "users update own reviews" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin manages reviews" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- content ----------
create policy "public reads visible sections" on public.homepage_sections
  for select using (is_visible = true or public.is_admin());
create policy "admin manages sections" on public.homepage_sections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads settings" on public.site_settings
  for select using (true);
create policy "admin manages settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- inventory / logs / notifications: admin only ----------
create policy "admin reads inventory" on public.inventory_transactions
  for select using (public.is_admin());
create policy "admin writes inventory" on public.inventory_transactions
  for insert with check (public.is_admin());

create policy "admin logs" on public.admin_activity_logs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin reads notifications" on public.admin_notifications
  for select using (public.is_admin());
create policy "admin updates notifications" on public.admin_notifications
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- storage ----------
create policy "public reads store buckets" on storage.objects
  for select using (bucket_id in ('product-images', 'category-images', 'brand-assets', 'product-models'));
create policy "admin uploads to store buckets" on storage.objects
  for insert with check (
    bucket_id in ('product-images', 'category-images', 'brand-assets', 'product-models') and public.is_admin()
  );
create policy "admin updates store objects" on storage.objects
  for update using (
    bucket_id in ('product-images', 'category-images', 'brand-assets', 'product-models') and public.is_admin()
  );
create policy "admin deletes store objects" on storage.objects
  for delete using (
    bucket_id in ('product-images', 'category-images', 'brand-assets', 'product-models') and public.is_admin()
  );

-- ============================================================
-- SUPER ADMIN SETUP: after registering on the site, run:
-- update public.profiles set role = 'super_admin' where email = 'your-admin@email.com';
-- ============================================================

-- ============================================================
-- ROLE MANAGEMENT (super_admin only)
-- ============================================================

-- Prevent role changes through the normal API entirely:
-- authenticated users may only update these safe columns.
revoke update on table public.profiles from anon, authenticated;
grant update (full_name, phone, is_disabled, internal_note)
  on table public.profiles to authenticated;

-- The ONLY way to change a role: this function, callable by super_admin.
create or replace function public.set_user_role(target_email text, new_role text)
returns void language plpgsql security definer set search_path = public as $$
declare
  caller_role text;
  target_id uuid;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is distinct from 'super_admin' then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if new_role not in ('customer', 'admin', 'super_admin') then
    raise exception 'INVALID_ROLE';
  end if;
  select id into target_id from public.profiles where lower(email) = lower(target_email);
  if target_id is null then
    raise exception 'USER_NOT_FOUND';
  end if;
  if target_id = auth.uid() and new_role <> 'super_admin' then
    raise exception 'CANNOT_DEMOTE_SELF';
  end if;
  update public.profiles set role = new_role where id = target_id;
end;
$$;
