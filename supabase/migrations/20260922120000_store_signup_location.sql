-- Preserve mandatory signup coordinates when Supabase email confirmation delays the session.
drop trigger if exists on_auth_user_created on auth.users;
alter function public.handle_new_user() rename to handle_new_user_previous;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    email,
    location_latitude,
    location_longitude,
    location_accuracy,
    location_updated_at
  )
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'location_latitude', '')::double precision,
    nullif(new.raw_user_meta_data ->> 'location_longitude', '')::double precision,
    nullif(new.raw_user_meta_data ->> 'location_accuracy', '')::double precision,
    case
      when new.raw_user_meta_data ? 'location_latitude' then now()
      else null
    end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email,
    location_latitude = excluded.location_latitude,
    location_longitude = excluded.location_longitude,
    location_accuracy = excluded.location_accuracy,
    location_updated_at = excluded.location_updated_at;
  return new;
end;
$$;

alter function public.handle_new_user_previous() rename to handle_new_user_legacy;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
