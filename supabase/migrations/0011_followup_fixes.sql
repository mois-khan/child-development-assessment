-- ═══════════════════════════════════════════════════════════════════════════
-- Follow-up fixes from the full-platform audit (2026-09-10), batch 2
--
-- 1. profiles_update had no column restriction — a parent's own client call
--    could overwrite profiles.email directly, bypassing the confirmed-change
--    invariant 0005_sync_profile_email.sql exists to guarantee. A trigger now
--    reverts an email change unless it comes from an admin, or from a system
--    context with no client session (sync_profile_email() itself, or a
--    service-role script) — auth.uid() is null in both of those cases.
-- 2. admin_users had no DELETE policy, so there was no way to revoke a staff
--    member's admin-panel access short of a manual database edit.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.protect_profile_email()
returns trigger
language plpgsql
as $$
begin
  if new.email is distinct from old.email
     and auth.uid() is not null
     and not public.is_admin() then
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_email on profiles;
create trigger profiles_protect_email
  before update on profiles
  for each row execute function public.protect_profile_email();

create policy admin_users_delete on admin_users
  for delete using (public.is_super_admin());
