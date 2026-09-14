-- ═══════════════════════════════════════════════════════════════════════════
-- Retire the standalone "Parents" admin page — folded into Leads, since every
-- profile gets exactly one lead row at signup (see handle_new_user() in
-- 0007_schools.sql) and the Leads worklist already shows name/phone/email/
-- status, with the lead detail page covering everything the old Parents
-- profile popup did.
--
-- This also fixes a latent bug: profiles_read (added in 0003) only checked
-- has_page_access('parents'), never 'leads' — so an admin granted only
-- "Leads" already couldn't see parent names/phone/email on their own page,
-- the join just came back null under RLS. Folding the pages together and
-- switching the check to 'leads' fixes that for good.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Anyone who had "parents" access gets the equivalent "leads" access, so
--    no admin silently loses the ability to see parent contact info.
insert into public.admin_page_access (admin_user_id, page_id, granted_by)
select admin_user_id, 'leads', granted_by
from public.admin_page_access
where page_id = 'parents'
on conflict (admin_user_id, page_id) do nothing;

-- 2. profiles_read now checks 'leads' instead of the retired 'parents' grant.
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles
  for select using (id = auth.uid() or (public.is_admin() and public.has_page_access('leads')));

-- 3. profiles_update_admin: drop the now-redundant half of the OR (0003 had
--    it check either grant since both pages edited the same table).
drop policy if exists profiles_update_admin on profiles;
create policy profiles_update_admin on profiles
  for update using (public.is_admin() and public.has_page_access('leads'))
  with check (public.is_admin() and public.has_page_access('leads'));

-- 4. Remove the page from the registry — cascades and drops the now-migrated
--    admin_page_access rows for it.
delete from public.admin_pages where id = 'parents';
