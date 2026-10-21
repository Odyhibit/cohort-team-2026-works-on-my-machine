-- Keep a public profile for each Supabase Auth user, including users created
-- outside the app's sign-up page. The trigger runs in the sign-up transaction.

create function public.create_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'User'
    ),
    'user'
  );
  return new;
end;
$$;

revoke all on function public.create_profile_for_new_auth_user()
  from public, anon, authenticated;

create trigger create_profile_for_new_auth_user
  after insert on auth.users
  for each row execute function public.create_profile_for_new_auth_user();

-- Existing Auth users may have signed up before this trigger was installed.
insert into public.profiles (id, name, role)
select
  id,
  coalesce(
    nullif(btrim(raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(email, '@', 1), ''),
    'User'
  ),
  'user'
from auth.users
where true
on conflict (id) do nothing;
