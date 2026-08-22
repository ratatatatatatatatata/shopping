alter table public.products
  add column if not exists size_guide jsonb;

comment on column public.products.size_guide is
  'Per-product editable size guide: title, description, columns, and rows.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_size_guide_shape'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_size_guide_shape check (
        size_guide is null
        or (
          jsonb_typeof(size_guide) = 'object'
          and coalesce(jsonb_typeof(size_guide -> 'columns') = 'array', false)
          and coalesce(jsonb_typeof(size_guide -> 'rows') = 'array', false)
        )
      );
  end if;
end
$$;
