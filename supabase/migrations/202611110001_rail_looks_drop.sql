-- ============================================================
-- Orasuits — Garment rail, "Сет хувцас" looks, balloon-drop section
-- Run once in Supabase SQL Editor (safe to re-run).
-- ============================================================

-- 1) Garment rail (homepage hero): per-product hanger cut-out + flag
alter table public.products
  add column if not exists show_on_rail boolean not null default false,
  add column if not exists rail_image_url text,
  add column if not exists rail_sort integer not null default 0;

comment on column public.products.rail_image_url is
  'Transparent PNG/WebP of the garment on a hanger, shown on the homepage rail.';

create index if not exists idx_products_rail
  on public.products(show_on_rail, rail_sort);

-- 2) Looks ("Сет хувцас")
create table if not exists public.looks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  model_image_url text not null,
  coupon_code text,
  discount_pct numeric(5,2) not null default 0
    check (discount_pct >= 0 and discount_pct <= 90),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_looks_updated on public.looks;
create trigger trg_looks_updated before update on public.looks
  for each row execute function public.set_updated_at();

create table if not exists public.look_items (
  id uuid primary key default uuid_generate_v4(),
  look_id uuid not null references public.looks(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  pin_x numeric(5,2) not null default 50 check (pin_x between 0 and 100),
  pin_y numeric(5,2) not null default 50 check (pin_y between 0 and 100),
  is_new boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_look_items_look on public.look_items(look_id);

alter table public.looks enable row level security;
alter table public.look_items enable row level security;

drop policy if exists "public reads visible looks" on public.looks;
create policy "public reads visible looks" on public.looks
  for select using (is_visible = true or public.is_admin());

drop policy if exists "admin manages looks" on public.looks;
create policy "admin manages looks" on public.looks
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads items of visible looks" on public.look_items;
create policy "public reads items of visible looks" on public.look_items
  for select using (
    public.is_admin() or
    exists (select 1 from public.looks l where l.id = look_id and l.is_visible = true)
  );

drop policy if exists "admin manages look items" on public.look_items;
create policy "admin manages look items" on public.look_items
  for all using (public.is_admin()) with check (public.is_admin());

-- 3) Balloon-drop homepage section (edited in Admin → Агуулга)
insert into public.homepage_sections (key, title, subtitle, sort_order, is_visible, content)
values (
  'drop',
  'Таны өдөр бүрийн стиль. Таны хэмжээнд.',
  'Шинэ коллекц нэг дороос — өмсөхөд бэлэн, тохирох размертай.',
  3,
  true,
  '{}'::jsonb
)
on conflict (key) do nothing;
