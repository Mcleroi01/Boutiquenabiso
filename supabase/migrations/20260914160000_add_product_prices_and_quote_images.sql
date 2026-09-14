-- Product financial fields. Keep price as a compatibility mirror of selling_price.
alter table public.products add column if not exists purchase_price numeric(10,2);
alter table public.products add column if not exists selling_price numeric(10,2);
alter table public.products add column if not exists currency text not null default 'USD';

update public.products
set selling_price = coalesce(selling_price, price, 0),
    purchase_price = coalesce(purchase_price, 0)
where selling_price is null or purchase_price is null;

alter table public.products alter column purchase_price set default 0;
alter table public.products alter column selling_price set default 0;
alter table public.products alter column purchase_price set not null;
alter table public.products alter column selling_price set not null;
alter table public.products add constraint products_purchase_price_nonnegative check (purchase_price >= 0);
alter table public.products add constraint products_selling_price_nonnegative check (selling_price >= 0);

create or replace function public.sync_product_prices()
returns trigger
language plpgsql
as $$
begin
  new.price := new.selling_price;
  return new;
end;
$$;

drop trigger if exists sync_product_prices_before_write on public.products;
create trigger sync_product_prices_before_write
before insert or update of selling_price on public.products
for each row execute procedure public.sync_product_prices();

drop policy if exists "auth_insert_products" on public.products;
create policy "auth_insert_products" on public.products for insert
to authenticated with check (public.is_admin());
drop policy if exists "auth_update_products" on public.products;
create policy "auth_update_products" on public.products for update
to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "auth_delete_products" on public.products;
create policy "auth_delete_products" on public.products for delete
to authenticated using (public.is_admin());

-- Multiple quote images are persisted as rows, not base64 or JSON blobs.
insert into public.product_images (product_id, storage_path, image_url, sort_order)
select p.id, image_item.image_url, image_item.image_url, image_item.image_index - 1
from public.products p
cross join lateral jsonb_array_elements_text(coalesce(p.images, '[]'::jsonb)) with ordinality as image_item(image_url, image_index)
where not exists (
  select 1 from public.product_images existing
  where existing.product_id = p.id and existing.sort_order = image_item.image_index - 1
);

create table if not exists public.quote_images (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  storage_path text not null,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_images_quote_id on public.quote_images(quote_id, sort_order);
alter table public.quote_images enable row level security;

drop policy if exists "public_insert_quote_images" on public.quote_images;

drop policy if exists "admin_select_quote_images" on public.quote_images;
create policy "admin_select_quote_images" on public.quote_images for select
to authenticated using (public.is_admin());

drop policy if exists "admin_delete_quote_images" on public.quote_images;
create policy "admin_delete_quote_images" on public.quote_images for delete
to authenticated using (public.is_admin());

create or replace function public.submit_quote(
  quote_full_name text,
  quote_whatsapp text,
  quote_platform text,
  quote_product_link text,
  quote_product_description text,
  quote_quantity integer,
  quote_image_paths text[] default '{}',
  quote_message text default null
)
returns public.quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  created_quote public.quotes;
  image_path text;
  image_index integer := 0;
begin
  if nullif(trim(quote_full_name), '') is null
     or nullif(trim(quote_whatsapp), '') is null
     or nullif(trim(quote_product_description), '') is null
     or quote_quantity is null or quote_quantity < 1 then
    raise exception 'Nom, WhatsApp, description et quantité sont obligatoires';
  end if;

  insert into public.quotes (
    full_name, whatsapp, customer_name, customer_phone, platform,
    product_link, product_description, quantity, image_path, image_url,
    image_paths, message, status
  ) values (
    trim(quote_full_name), trim(quote_whatsapp), trim(quote_full_name), trim(quote_whatsapp),
    coalesce(nullif(trim(quote_platform), ''), 'Non précisée'),
    nullif(trim(quote_product_link), ''), trim(quote_product_description), quote_quantity,
    quote_image_paths[1], quote_image_paths[1], quote_image_paths, quote_message, 'pending'
  ) returning * into created_quote;

  foreach image_path in array coalesce(quote_image_paths, '{}') loop
    insert into public.quote_images (quote_id, storage_path, image_url, sort_order)
    values (created_quote.id, image_path, image_path, image_index);
    image_index := image_index + 1;
  end loop;
  return created_quote;
end;
$$;

revoke all on function public.submit_quote(text, text, text, text, text, integer, text[], text) from public;
grant execute on function public.submit_quote(text, text, text, text, text, integer, text[], text) to anon, authenticated;

-- Anon receives only public product columns. Admins continue reading products directly.
create or replace view public.public_catalog_products as
select id, name, description, selling_price as price, category_id, stock_status,
       quantity, variants, images, featured, created_at, updated_at, currency
from public.products;

revoke all on public.products from anon;
grant select on public.public_catalog_products to anon;
grant select on public.public_catalog_products to authenticated;
