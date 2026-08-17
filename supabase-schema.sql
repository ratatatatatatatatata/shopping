-- ============================================================
-- Orasuits Store v2 — Supabase Database Schema (full)
-- Run this FIRST in the Supabase SQL Editor (fresh project).
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'super_admin')),
  is_disabled boolean not null default false,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin') and is_disabled = false
  );
$$;

-- ---------- brands ----------
create table public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- categories (hierarchical) ----------
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  image_url text,
  image_position text not null default 'center', -- which part shows when cropped
  image_fit text not null default 'cover',       -- cover = crop, contain = show whole image
  parent_id uuid references public.categories(id) on delete set null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_categories_parent on public.categories(parent_id);
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------- products ----------
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  name text not null,
  slug text not null unique,
  sku text,
  barcode text,
  gender text not null default 'unisex' check (gender in ('men', 'women', 'kids', 'unisex')),
  short_description text,
  description text,
  material text,
  care_instructions text,
  base_price numeric(12,2) not null default 0,
  sale_price numeric(12,2),
  cost_price numeric(12,2),
  sale_start_at timestamptz,
  sale_end_at timestamptz,
  main_image_url text,
  image_position text not null default 'center', -- object-position for cropped views
  model_url text, -- optional GLB/GLTF 3D model
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  tags text[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category on public.products(category_id);
create index idx_products_brand on public.products(brand_id);
create index idx_products_status on public.products(status);
create index idx_products_slug on public.products(slug);
create index idx_products_created on public.products(created_at);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- product_colors ----------
create table public.product_colors (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_name text not null,
  color_code text not null default '#000000',
  image_url text,
  created_at timestamptz not null default now()
);
create index idx_colors_product on public.product_colors(product_id);

-- ---------- product_variants ----------
create table public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid not null references public.product_colors(id) on delete cascade,
  size text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  sku text,
  price numeric(12,2),
  sale_price numeric(12,2),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_variants_product on public.product_variants(product_id);
create index idx_variants_color on public.product_variants(color_id);
create trigger trg_variants_updated before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ---------- product_images (gallery, orderable, per-color optional) ----------
create table public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.product_colors(id) on delete set null,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  object_position text not null default 'center',
  created_at timestamptz not null default now()
);
create index idx_images_product on public.product_images(product_id);

-- ---------- collections ----------
create table public.collections (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

-- ---------- carts ----------
create table public.carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_carts_updated before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);
create index idx_cart_items_cart on public.cart_items(cart_id);

-- ---------- wishlists ----------
create table public.wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.wishlist_items (
  id uuid primary key default uuid_generate_v4(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

-- ---------- addresses ----------
create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  city text not null,
  district text,
  khoroo text,
  address_detail text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_addresses_user on public.addresses(user_id);

-- ---------- coupons ----------
create table public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed', 'free_shipping')),
  discount_value numeric(12,2) not null default 0,
  min_order_amount numeric(12,2) not null default 0,
  usage_limit integer,
  usage_limit_per_customer integer,
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  used_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.coupon_usage (
  id uuid primary key default uuid_generate_v4(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid,
  created_at timestamptz not null default now()
);
create index idx_coupon_usage_coupon on public.coupon_usage(coupon_id);

-- ---------- orders ----------
create or replace function public.gen_order_number()
returns text language sql as $$
  select 'ORA' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random() * 100000)::text, 5, '0');
$$;

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique default public.gen_order_number(),
  customer_name text not null,
  phone text not null,
  email text,
  city text not null default 'Улаанбаатар',
  district text,
  khoroo text,
  address_detail text not null,
  delivery_note text,
  delivery_method text not null default 'standard' check (delivery_method in ('standard', 'express', 'pickup')),
  payment_method text not null check (payment_method in ('cod', 'bank_transfer', 'qpay', 'online')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'pending' check (order_status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  coupon_code text,
  tracking_number text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(order_status);
create index idx_orders_created on public.orders(created_at);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  color_name text,
  size text,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);

-- ---------- payments ----------
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  transaction_note text,
  created_at timestamptz not null default now()
);
create index idx_payments_order on public.payments(order_id);

-- ---------- reviews ----------
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index idx_reviews_product on public.reviews(product_id);

-- ---------- content management ----------
create table public.homepage_sections (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  title text,
  subtitle text,
  image_url text,
  link_url text,
  content jsonb not null default '{}',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger trg_sections_updated before update on public.homepage_sections
  for each row execute function public.set_updated_at();

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger trg_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------- inventory ----------
create table public.inventory_transactions (
  id uuid primary key default uuid_generate_v4(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  type text not null check (type in ('initial_stock', 'manual_adjustment', 'order_reserved', 'order_completed', 'order_cancelled', 'return', 'damaged')),
  quantity_change integer not null,
  note text,
  order_id uuid references public.orders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_inv_variant on public.inventory_transactions(variant_id);

-- Safe stock adjustment + transaction log (security definer)
create or replace function public.adjust_stock(
  p_variant_id uuid,
  p_change integer,
  p_type text,
  p_order_id uuid default null,
  p_note text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants
  set stock_quantity = stock_quantity + p_change
  where id = p_variant_id and stock_quantity + p_change >= 0;
  if not found then
    raise exception 'INSUFFICIENT_STOCK';
  end if;
  insert into public.inventory_transactions (variant_id, type, quantity_change, order_id, note, created_by)
  values (p_variant_id, p_type, p_change, p_order_id, p_note, auth.uid());
end;
$$;

-- ---------- admin activity + notifications ----------
create table public.admin_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.admin_notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null default 'order',
  title text not null,
  message text,
  is_read boolean not null default false,
  order_id uuid references public.orders(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.admin_notifications (type, title, message, order_id)
  values ('order', 'Шинэ захиалга', 'Захиалга #' || new.order_number || ' — ' || new.total_amount || '₮', new.id);
  return new;
end;
$$;
create trigger on_order_created after insert on public.orders
  for each row execute function public.notify_new_order();

-- ---------- best sellers view ----------
create or replace view public.best_sellers as
select p.*, coalesce(sum(oi.quantity), 0)::bigint as total_sold
from public.products p
left join public.order_items oi on oi.product_id = p.id
where p.status = 'published'
group by p.id
order by total_sold desc;

-- ---------- storage buckets ----------
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('category-images', 'category-images', true),
  ('brand-assets', 'brand-assets', true),
  ('product-models', 'product-models', true)
on conflict (id) do nothing;
