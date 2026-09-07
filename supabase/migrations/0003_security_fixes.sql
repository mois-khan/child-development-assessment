-- ═══════════════════════════════════════════════════════════════════════════
-- Security & correctness fixes found in the full-app audit (2026-09-07)
--
-- 1. admin_page_access.granted_by now defaults to auth.uid() — the client
--    was passing the literal string "current_user_id", which is not a valid
--    uuid, so every page-access save was failing silently.
-- 2. admin_users had no UPDATE policy at all, so changing a user's role from
--    the User Management page failed silently too. Added, restricted to
--    super_admin.
-- 3. profiles had no admin UPDATE policy — editing a parent's name/phone/email
--    from the lead detail page ran under the admin's own auth.uid(), matched
--    zero rows, and silently did nothing.
-- 4. admin_page_access exists specifically to scope what each non-super-admin
--    role can reach, but every other RLS policy only checked is_admin() —
--    meaning any admin_users row, regardless of role or page grants, could
--    read every parent's children/assessments/leads/payments directly from
--    the browser console. Policies below now also require has_page_access()
--    for the matching page, so data access finally follows page access.
-- 5. assessments could be inserted by any signed-in parent for any of their
--    children with no payment check — the ₹99 gate was UI-only. Insert now
--    requires a matching paid row in payments.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. admin_page_access.granted_by defaults to the caller ────────────────

alter table public.admin_page_access
  alter column granted_by set default auth.uid();


-- ─── helper: is_super_admin() ──────────────────────────────────────────────

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where id = auth.uid() and role = 'super_admin'
  );
$$;


-- ─── 2. admin_users: allow super_admin to update roles ─────────────────────

create policy admin_users_update on admin_users
  for update using (public.is_super_admin())
  with check (public.is_super_admin());


-- ─── 3. profiles: allow the staff who actually touch this table to edit ───
-- adminUpdateLead() (lib/admin/leads.ts) edits a parent's contact info from
-- the *leads* page, not a "parents" page — either grant should unlock it.

create policy profiles_update_admin on profiles
  for update using (
    public.is_admin() and (public.has_page_access('parents') or public.has_page_access('leads'))
  )
  with check (
    public.is_admin() and (public.has_page_access('parents') or public.has_page_access('leads'))
  );


-- ─── 4. scope every staff read/write to the matching page grant ───────────
-- super_admin is unaffected: has_page_access() always returns true for it.

drop policy if exists admin_self_read on admin_users;
create policy admin_self_read on admin_users
  for select using (id = auth.uid() or (public.is_admin() and public.has_page_access('users')));

drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles
  for select using (id = auth.uid() or (public.is_admin() and public.has_page_access('parents')));

drop policy if exists children_read on children;
create policy children_read on children
  for select using (profile_id = auth.uid() or (public.is_admin() and public.has_page_access('children')));

drop policy if exists assessments_read on assessments;
create policy assessments_read on assessments
  for select using (
    exists (select 1 from children c
             where c.id = assessments.child_id
               and (c.profile_id = auth.uid() or (public.is_admin() and public.has_page_access('assessments'))))
  );

drop policy if exists responses_read on responses;
create policy responses_read on responses
  for select using (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id
               and (c.profile_id = auth.uid() or (public.is_admin() and public.has_page_access('assessments'))))
  );

drop policy if exists leads_admin_read on leads;
drop policy if exists leads_admin_update on leads;
create policy leads_admin_read on leads
  for select using (public.is_admin() and public.has_page_access('leads'));
create policy leads_admin_update on leads
  for update using (public.is_admin() and public.has_page_access('leads'));

drop policy if exists interactions_admin_read on interactions;
drop policy if exists interactions_admin_write on interactions;
create policy interactions_admin_read on interactions
  for select using (public.is_admin() and public.has_page_access('leads'));
create policy interactions_admin_write on interactions
  for insert with check (public.is_admin() and public.has_page_access('leads'));

drop policy if exists payments_read on payments;
create policy payments_read on payments
  for select using (profile_id = auth.uid() or (public.is_admin() and public.has_page_access('purchases')));


-- ─── 5. an assessment can only be created once the child has a paid record ─
-- "Paid" includes the launch coupon — see app/api/payments/coupon, which
-- inserts a payments row with amount_paise = 0 rather than bypassing the
-- table altogether, so this stays the single source of truth either way.

drop policy if exists assessments_insert on assessments;
create policy assessments_insert on assessments
  for insert with check (
    exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
    and exists (select 1 from payments p
             where p.child_id = assessments.child_id
               and p.profile_id = auth.uid()
               and p.status = 'paid')
  );
