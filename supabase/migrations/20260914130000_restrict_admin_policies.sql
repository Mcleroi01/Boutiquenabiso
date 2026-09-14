create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

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
