-- User profile data is separate from Supabase Auth credentials.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select
to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'phone', ''), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill profiles for Auth users that existed before this migration.
insert into public.profiles (id, full_name, phone)
select
  id,
  nullif(coalesce(raw_user_meta_data ->> 'full_name', ''), ''),
  nullif(coalesce(raw_user_meta_data ->> 'phone', ''), '')
from auth.users
on conflict (id) do nothing;

-- The first authenticated user may claim admin exactly once.
-- It cannot be called again after an admin profile exists.
create or replace function public.claim_first_admin(
  requested_full_name text default null,
  requested_phone text default null
)
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  claimed_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtext('boutique_na_biso:first_admin'));

  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'The first administrator has already been created';
  end if;

  update public.profiles
  set full_name = coalesce(nullif(trim(requested_full_name), ''), full_name),
      phone = coalesce(nullif(trim(requested_phone), ''), phone),
      role = 'admin',
      updated_at = now()
  where id = auth.uid()
  returning * into claimed_profile;

  if claimed_profile.id is null then
    raise exception 'Profile not found';
  end if;

  return claimed_profile;
end;
$$;

revoke all on function public.claim_first_admin(text, text) from public;
grant execute on function public.claim_first_admin(text, text) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Replace the earlier app_metadata-based policies with profile-role checks.
drop policy if exists "auth_insert_categories" on public.categories;
create policy "auth_insert_categories" on public.categories for insert
to authenticated with check (public.is_admin());
drop policy if exists "auth_update_categories" on public.categories;
create policy "auth_update_categories" on public.categories for update
to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "auth_delete_categories" on public.categories;
create policy "auth_delete_categories" on public.categories for delete
to authenticated using (public.is_admin());

drop policy if exists "auth_insert_products" on public.products;
create policy "auth_insert_products" on public.products for insert
to authenticated with check (public.is_admin());
drop policy if exists "auth_update_products" on public.products;
create policy "auth_update_products" on public.products for update
to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "auth_delete_products" on public.products;
create policy "auth_delete_products" on public.products for delete
to authenticated using (public.is_admin());

drop policy if exists "auth_select_orders" on public.orders;
create policy "auth_select_orders" on public.orders for select
to authenticated using (public.is_admin());
drop policy if exists "auth_insert_orders" on public.orders;
create policy "auth_insert_orders" on public.orders for insert
to authenticated with check (public.is_admin());
drop policy if exists "auth_update_orders" on public.orders;
create policy "auth_update_orders" on public.orders for update
to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "auth_delete_orders" on public.orders;
create policy "auth_delete_orders" on public.orders for delete
to authenticated using (public.is_admin());

drop policy if exists "auth_insert_settings" on public.settings;
create policy "auth_insert_settings" on public.settings for insert
to authenticated with check (public.is_admin());
drop policy if exists "auth_update_settings" on public.settings;
create policy "auth_update_settings" on public.settings for update
to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "auth_delete_settings" on public.settings;
create policy "auth_delete_settings" on public.settings for delete
to authenticated using (public.is_admin());
