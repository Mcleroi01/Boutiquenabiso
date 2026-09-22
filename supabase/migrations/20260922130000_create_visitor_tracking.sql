-- Privacy-conscious first-party visitor analytics.
create table if not exists public.site_visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_key text not null unique,
  session_key text not null,
  user_id uuid references auth.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_path text not null,
  page_views integer not null default 0,
  device_type text not null default 'desktop' check (device_type in ('mobile', 'tablet', 'desktop'))
);

create table if not exists public.site_page_views (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references public.site_visitors(id) on delete cascade,
  session_key text not null,
  user_id uuid references auth.users(id) on delete set null,
  path text not null,
  page_title text,
  referrer text,
  device_type text not null default 'desktop' check (device_type in ('mobile', 'tablet', 'desktop')),
  viewed_at timestamptz not null default now()
);

create index if not exists idx_site_visitors_last_seen on public.site_visitors(last_seen_at desc);
create index if not exists idx_site_page_views_viewed_at on public.site_page_views(viewed_at desc);
create index if not exists idx_site_page_views_path on public.site_page_views(path);
create index if not exists idx_site_page_views_visitor on public.site_page_views(visitor_id, viewed_at desc);

alter table public.site_visitors enable row level security;
alter table public.site_page_views enable row level security;

drop policy if exists "admin_select_site_visitors" on public.site_visitors;
create policy "admin_select_site_visitors" on public.site_visitors for select
to authenticated using (public.is_admin());

drop policy if exists "admin_select_site_page_views" on public.site_page_views;
create policy "admin_select_site_page_views" on public.site_page_views for select
to authenticated using (public.is_admin());

create or replace function public.track_site_page_view(
  p_visitor_key text,
  p_session_key text,
  p_path text,
  p_page_title text default null,
  p_referrer text default null,
  p_device_type text default 'desktop'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tracked_visitor_id uuid;
  current_user_id uuid := auth.uid();
  safe_device text := case when p_device_type in ('mobile', 'tablet', 'desktop') then p_device_type else 'desktop' end;
begin
  if p_visitor_key is null or length(trim(p_visitor_key)) < 8 then
    raise exception 'Visitor key is required';
  end if;
  if p_session_key is null or length(trim(p_session_key)) < 8 then
    raise exception 'Session key is required';
  end if;
  if p_path is null or left(p_path, 1) <> '/' or length(p_path) > 500 then
    raise exception 'Valid page path is required';
  end if;

  insert into public.site_visitors (visitor_key, session_key, user_id, last_path, page_views, device_type)
  values (p_visitor_key, p_session_key, current_user_id, p_path, 1, safe_device)
  on conflict (visitor_key) do update set
    session_key = excluded.session_key,
    user_id = coalesce(excluded.user_id, public.site_visitors.user_id),
    last_seen_at = now(),
    last_path = excluded.last_path,
    page_views = public.site_visitors.page_views + 1,
    device_type = excluded.device_type
  returning id into tracked_visitor_id;

  insert into public.site_page_views (
    visitor_id, session_key, user_id, path, page_title, referrer, device_type
  )
  values (
    tracked_visitor_id, p_session_key, current_user_id, p_path,
    nullif(left(p_page_title, 250), ''), nullif(left(p_referrer, 500), ''), safe_device
  );
end;
$$;

revoke all on function public.track_site_page_view(text, text, text, text, text, text) from public;
grant execute on function public.track_site_page_view(text, text, text, text, text, text) to anon, authenticated;
