-- ═══════════════════════════════════════════════════════════════════════════
-- Keep profiles.email in step with the account's real email
--
-- A parent's email lives in two places: auth.users.email, which is their
-- login identity, and profiles.email, which is what the admin panel, the
-- leads list and every "contact this family" surface actually read.
--
-- handle_new_user() copies the address across at signup and nothing has ever
-- copied it again. So the moment a parent changes their email — which they
-- can now do from their profile page — the admin panel would keep showing
-- the old one, and sales would keep writing to an address the family has
-- stopped using. Nothing would look broken; it would just quietly be wrong.
--
-- Supabase only writes the new address to auth.users AFTER the parent
-- confirms it from their inbox, so this fires on confirmation, not on
-- request. An unconfirmed change never reaches profiles.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email = new.email
   where id = new.id
     and email is distinct from new.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();
