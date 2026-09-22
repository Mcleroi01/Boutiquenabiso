-- Client accounts, customer-owned orders, tracking history and notifications.
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists neighborhood text;
alter table public.profiles add column if not exists location_latitude double precision;
alter table public.profiles add column if not exists location_longitude double precision;
alter table public.profiles add column if not exists location_accuracy double precision;
alter table public.profiles add column if not exists location_updated_at timestamptz;
alter table public.profiles add column if not exists disabled_at timestamptz;
alter table public.quotes add column if not exists customer_id uuid references public.profiles(id) on delete set null;

alter table public.orders add column if not exists customer_id uuid references public.profiles(id) on delete set null;
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists shipping_cost numeric(10,2) not null default 0 check (shipping_cost >= 0);
alter table public.orders add column if not exists total_estimated numeric(10,2) not null default 0 check (total_estimated >= 0);
alter table public.orders add column if not exists currency text not null default 'USD';
alter table public.orders add column if not exists delivery_city text;
alter table public.orders add column if not exists customer_note text;
alter table public.orders add column if not exists variant_selection jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists admin_note text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists carrier text;
alter table public.orders add column if not exists estimated_delivery date;
alter table public.orders add column if not exists delivery_latitude double precision;
alter table public.orders add column if not exists delivery_longitude double precision;
alter table public.orders add column if not exists delivery_accuracy double precision;
alter table public.orders add column if not exists delivery_location_updated_at timestamptz;
alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.orders add column if not exists updated_at timestamptz not null default now();

update public.orders set status = 'pending' where status = 'new';
update public.orders set order_number = 'BNB-' || to_char(public.orders.created_at, 'YYYY') || '-' || lpad(numbered.sequence::text, 4, '0')
from (select id, row_number() over (order by created_at, id) as sequence from public.orders) numbered
where public.orders.id = numbered.id and public.orders.order_number is null;
update public.orders set total_estimated = price * quantity + shipping_cost where total_estimated = 0;
update public.profiles p set email = u.email from auth.users u where p.id = u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''), nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('pending','confirmed','payment_pending','paid','purchasing','purchased','shipping_to_agency','arrived_at_agency','in_transit','arrived_in_kinshasa','ready_for_delivery','delivered','cancelled'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('unpaid','pending','paid','refunded'));
create unique index if not exists orders_order_number_unique on public.orders(order_number) where order_number is not null;
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_quotes_customer_id on public.quotes(customer_id);
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  comment text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.order_status_history enable row level security;
create index if not exists idx_order_status_history_order on public.order_status_history(order_id, created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- Replace legacy admin-only policies with least-privilege customer policies.
drop policy if exists "auth_select_orders" on public.orders;
drop policy if exists "auth_insert_orders" on public.orders;
drop policy if exists "auth_update_orders" on public.orders;
drop policy if exists "auth_delete_orders" on public.orders;
drop policy if exists "orders_select_owner_or_admin" on public.orders;
create policy "orders_select_owner_or_admin" on public.orders for select to authenticated using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "orders_insert_owner_or_admin" on public.orders;
create policy "orders_insert_owner_or_admin" on public.orders for insert to authenticated with check ((customer_id = auth.uid() and status = 'pending' and payment_status = 'unpaid' and (product_id is null or exists (select 1 from public.products p where p.id = product_id and p.price = orders.price))) or public.is_admin());
drop policy if exists "orders_update_admin_only" on public.orders;
create policy "orders_update_admin_only" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders_delete_admin_only" on public.orders;
create policy "orders_delete_admin_only" on public.orders for delete to authenticated using (public.is_admin());

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = 'user');
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "quotes_customer_select" on public.quotes;
create policy "quotes_customer_select" on public.quotes for select to authenticated using (customer_id = auth.uid() or public.is_admin());

create or replace function public.attach_quote_to_client()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.customer_id is null and auth.uid() is not null then new.customer_id := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists quotes_attach_client on public.quotes;
create trigger quotes_attach_client before insert on public.quotes for each row execute procedure public.attach_quote_to_client();

drop policy if exists "order_history_owner_or_admin" on public.order_status_history;
create policy "order_history_owner_or_admin" on public.order_status_history for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin())));
drop policy if exists "order_history_admin_insert" on public.order_status_history;
create policy "order_history_admin_insert" on public.order_status_history for insert to authenticated with check (public.is_admin());
drop policy if exists "notifications_owner_or_admin" on public.notifications;
create policy "notifications_owner_or_admin" on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert" on public.notifications for insert to authenticated with check (public.is_admin());

create or replace function public.next_order_number()
returns text language plpgsql security definer set search_path = public as $$
declare next_number text;
begin
  select 'BNB-' || to_char(now(), 'YYYY') || '-' || lpad((count(*) + 1)::text, 4, '0') into next_number from public.orders where extract(year from created_at) = extract(year from now());
  while exists (select 1 from public.orders where order_number = next_number) loop
    next_number := 'BNB-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 9000) + 1000)::text, 4, '0');
  end loop;
  return next_number;
end $$;
grant execute on function public.next_order_number() to authenticated;

create or replace function public.convert_quote_to_order(quote_id uuid, unit_price numeric, order_notes text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare selected_quote public.quotes; created_order public.orders;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select * into selected_quote from public.quotes where id = quote_id for update;
  if selected_quote.id is null then raise exception 'Quote not found'; end if;
  if selected_quote.status = 'converted' then raise exception 'Quote already converted'; end if;
  insert into public.orders (order_number, customer_id, customer_name, customer_phone, product_id, product_name, quantity, price, total_estimated, currency, status, payment_status, customer_note, admin_note)
  values (public.next_order_number(), selected_quote.customer_id, selected_quote.customer_name, selected_quote.customer_phone, null, selected_quote.product_description, selected_quote.quantity, unit_price, unit_price * selected_quote.quantity, 'USD', 'pending', 'unpaid', null, order_notes)
  returning * into created_order;
  update public.quotes set status = 'converted', converted_order_id = created_order.id, proposed_price = unit_price, admin_note = order_notes, updated_at = now() where id = selected_quote.id;
  return created_order;
end $$;
revoke all on function public.convert_quote_to_order(uuid, numeric, text) from public;
grant execute on function public.convert_quote_to_order(uuid, numeric, text) to authenticated;

create or replace function public.record_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.order_status_history(order_id, status, changed_by, comment) values (new.id, new.status, auth.uid(), new.admin_note);
    if new.customer_id is not null and (tg_op = 'INSERT' or old.status is distinct from new.status) then
      insert into public.notifications(user_id, order_id, title, message) values (new.customer_id, new.id, 'Mise à jour de commande', 'Votre commande ' || coalesce(new.order_number, '') || ' est maintenant : ' || new.status);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_status_history_trigger on public.orders;
create trigger orders_status_history_trigger after insert or update of status on public.orders for each row execute procedure public.record_order_status_change();
