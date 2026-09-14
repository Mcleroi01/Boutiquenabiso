-- Quote workflow and product image storage.
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  platform text not null check (platform in ('Pinduoduo', 'Xianyu', '1688', 'Alibaba', 'Shein', 'Autre')),
  product_link text,
  product_description text not null,
  quantity integer not null check (quantity > 0),
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'converted')),
  proposed_price numeric(10, 2) check (proposed_price is null or proposed_price >= 0),
  admin_note text,
  converted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quotes_created_at on public.quotes(created_at desc);
alter table public.quotes enable row level security;

drop policy if exists "public_insert_quotes" on public.quotes;
create policy "public_insert_quotes" on public.quotes for insert
to anon, authenticated with check (
  status = 'pending'
  and proposed_price is null
  and admin_note is null
  and converted_order_id is null
);

drop policy if exists "admin_select_quotes" on public.quotes;
create policy "admin_select_quotes" on public.quotes for select
to authenticated using (public.is_admin());

drop policy if exists "admin_update_quotes" on public.quotes;
create policy "admin_update_quotes" on public.quotes for update
to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_delete_quotes" on public.quotes;
create policy "admin_delete_quotes" on public.quotes for delete
to authenticated using (public.is_admin());

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product_id on public.product_images(product_id, sort_order);
alter table public.product_images enable row level security;

drop policy if exists "public_select_product_images" on public.product_images;
create policy "public_select_product_images" on public.product_images for select
to anon, authenticated using (true);

drop policy if exists "admin_insert_product_images" on public.product_images;
create policy "admin_insert_product_images" on public.product_images for insert
to authenticated with check (public.is_admin());

drop policy if exists "admin_delete_product_images" on public.product_images;
create policy "admin_delete_product_images" on public.product_images for delete
to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('quote-images', 'quote-images', true), ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id in ('quote-images', 'product-images');

drop policy if exists "public_upload_quote_images" on storage.objects;
create policy "public_upload_quote_images" on storage.objects for insert
to anon, authenticated with check (bucket_id = 'quote-images' and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp'));

drop policy if exists "public_read_quote_images" on storage.objects;
create policy "public_read_quote_images" on storage.objects for select
using (bucket_id = 'quote-images');

drop policy if exists "admin_upload_product_images" on storage.objects;
create policy "admin_upload_product_images" on storage.objects for insert
to authenticated with check (bucket_id = 'product-images' and public.is_admin() and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp'));

drop policy if exists "admin_read_product_images" on storage.objects;
create policy "admin_read_product_images" on storage.objects for select
using (bucket_id = 'product-images' and (public.is_admin() or auth.role() = 'anon'));

drop policy if exists "admin_delete_product_images" on storage.objects;
create policy "admin_delete_product_images" on storage.objects for delete
to authenticated using (bucket_id = 'product-images' and public.is_admin());

create or replace function public.convert_quote_to_order(quote_id uuid, unit_price numeric, order_notes text default null)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  selected_quote public.quotes;
  created_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into selected_quote from public.quotes where id = quote_id for update;
  if selected_quote.id is null then
    raise exception 'Quote not found';
  end if;
  if selected_quote.status = 'converted' then
    raise exception 'Quote already converted';
  end if;

  insert into public.orders (customer_name, customer_phone, product_id, product_name, quantity, price, status, notes)
  values (selected_quote.customer_name, selected_quote.customer_phone, null, selected_quote.product_description, selected_quote.quantity, unit_price, 'new', order_notes)
  returning * into created_order;

  update public.quotes
  set status = 'converted', converted_order_id = created_order.id, proposed_price = unit_price, admin_note = order_notes, updated_at = now()
  where id = selected_quote.id;

  return created_order;
end;
$$;

revoke all on function public.convert_quote_to_order(uuid, numeric, text) from public;
grant execute on function public.convert_quote_to_order(uuid, numeric, text) to authenticated;
