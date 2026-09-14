-- Align the quote contract with the client form while keeping the original columns
-- for compatibility with existing data and the order conversion function.
alter table public.quotes add column if not exists full_name text;
alter table public.quotes add column if not exists whatsapp text;
alter table public.quotes add column if not exists image_path text;
alter table public.quotes add column if not exists message text;

update public.quotes
set full_name = coalesce(full_name, customer_name),
    whatsapp = coalesce(whatsapp, customer_phone),
    image_path = coalesce(image_path, image_url),
    message = coalesce(message, product_description)
where full_name is null or whatsapp is null or image_path is null or message is null;

alter table public.quotes alter column full_name set not null;
alter table public.quotes alter column whatsapp set not null;

drop policy if exists "public_insert_quotes" on public.quotes;
create policy "public_insert_quotes" on public.quotes for insert
to anon, authenticated with check (
  status = 'pending'
  and proposed_price is null
  and admin_note is null
  and converted_order_id is null
  and full_name is not null
  and whatsapp is not null
);

-- Public clients may submit a quote but cannot read the quotes table.
-- The client inserts without .select(), so no public SELECT policy is needed.
