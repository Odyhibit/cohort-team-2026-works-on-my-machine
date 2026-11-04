begin;

-- Restore least-privileged signup defaults. Existing users keep their roles.
alter table public.profiles alter column role set default 'clerk';
create or replace function public.create_profile_for_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(new.email, '@', 1), ''), 'User'), 'clerk');
  -- A requested role in user-editable signup metadata is deliberately ignored.
  return new;
end;
$$;
revoke all on function public.create_profile_for_new_auth_user() from public, anon, authenticated;

drop policy "Signed-in users can read profiles" on public.profiles;
create policy "Users can read their profile and admins can read all profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select app_private.is_admin()));

drop policy "Signed-in users can read approval rule settings" on public.approval_rule_settings;
drop policy "Signed-in users can update approval rule settings" on public.approval_rule_settings;
create policy "Admins can read approval rule settings"
  on public.approval_rule_settings for select to authenticated using ((select app_private.is_admin()));
create policy "Admins can update approval rule settings"
  on public.approval_rule_settings for update to authenticated
  using ((select app_private.is_admin())) with check ((select app_private.is_admin()));

drop policy "Signed-in users can read audit events" on public.audit_events;
create policy "Admins can read audit events"
  on public.audit_events for select to authenticated using ((select app_private.is_admin()));

-- Existing admin-only profile update policy and last-admin protection stay active.
-- The SECURITY DEFINER invoice evaluator can still read rule settings for clerks.
commit;
