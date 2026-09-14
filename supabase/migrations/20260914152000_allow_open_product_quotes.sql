-- Product searches may be submitted without a known platform or product link.
alter table public.quotes alter column platform drop not null;
alter table public.quotes drop constraint if exists quotes_platform_check;
alter table public.quotes add constraint quotes_platform_check
  check (platform is null or platform in ('Pinduoduo', 'Xianyu', '1688', 'Alibaba', 'Shein', 'Autre', 'Non précisée'));

alter table public.quotes add column if not exists image_paths text[];

-- Keep public submissions limited to an initial, unprocessed quote.
drop policy if exists "public_insert_quotes" on public.quotes;
create policy "public_insert_quotes" on public.quotes for insert
to anon, authenticated with check (
  status = 'pending'
  and proposed_price is null
  and admin_note is null
  and converted_order_id is null
  and full_name is not null
  and whatsapp is not null
  and product_description is not null
  and quantity > 0
);
