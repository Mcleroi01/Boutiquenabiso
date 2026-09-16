-- Stable, human-readable product URLs.
alter table public.products add column if not exists slug text;

create or replace function public.slugify_product_name(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(value, ''),
      'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖòóôõöÙÚÛÜùúûüÝýÿ',
      'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYyy')),
    '[^a-z0-9]+', '-', 'g'));
$$;

-- Backfill deterministically, including a suffix for duplicate names.
do $$
declare
  product_row record;
  base_slug text;
  candidate_slug text;
  suffix integer;
begin
  for product_row in select id, name from public.products order by created_at, id loop
    base_slug := coalesce(nullif(public.slugify_product_name(product_row.name), ''), 'produit');
    candidate_slug := base_slug;
    suffix := 2;
    while exists (select 1 from public.products where slug = candidate_slug and id <> product_row.id) loop
      candidate_slug := base_slug || '-' || suffix;
      suffix := suffix + 1;
    end loop;
    update public.products set slug = candidate_slug where id = product_row.id;
  end loop;
end $$;

alter table public.products alter column slug set not null;
create unique index if not exists products_slug_unique_idx on public.products (slug);

drop view if exists public.public_catalog_products;
create view public.public_catalog_products as
select id, name, slug, description, selling_price as price, category_id, stock_status,
       quantity, variants, images, featured, created_at, updated_at, currency
from public.products;

grant select on public.public_catalog_products to anon, authenticated;
