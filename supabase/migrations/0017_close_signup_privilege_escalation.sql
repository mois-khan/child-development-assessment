-- ═══════════════════════════════════════════════════════════════════════════
-- Critical: handle_new_user() trusted raw_user_meta_data for privilege
-- ('is_admin', 'role', 'account_type') — and raw_user_meta_data is exactly
-- what a public, unauthenticated caller sets via
-- supabase.auth.signUp({ options: { data } }), using nothing more than the
-- public anon key already shipped in the browser bundle. Anyone could sign
-- up with { is_admin: "true", role: "super_admin" } in that `data` object and
-- the trigger would insert them into admin_users with full access — or
-- { account_type: "school" } to get a schools row — without touching this
-- app's UI at all.
--
-- Fix: the trigger no longer branches on any client-suppliable privilege
-- field. Every new auth.users row gets exactly a parent profile + lead,
-- always. `full_name`/`phone`/`source` stay read from metadata — forging
-- those only misdescribes your own signup, not a privilege grant.
--
-- Staff and school provisioning move entirely into the two routes that
-- already do this under real, server-checked authorization
-- (app/api/admin/invite, app/api/admin/invite-school — super_admin / page-
-- grant-gated, both run with the service role): they now insert admin_users
-- / profiles(account_type='school') / schools themselves, and delete the
-- parent profile + lead this trigger creates as a side effect for those
-- ids, rather than smuggling the intent through metadata this trigger reads.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          coalesce(new.raw_user_meta_data ->> 'phone', ''),
          coalesce(new.email, ''))
  on conflict (id) do nothing;

  insert into public.leads (profile_id, status, source)
  values (new.id,
          'new',
          coalesce(nullif(new.raw_user_meta_data ->> 'source', ''), 'signup'))
  on conflict (profile_id) do nothing;

  return new;
end;
$$;
