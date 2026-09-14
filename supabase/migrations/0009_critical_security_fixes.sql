-- ═══════════════════════════════════════════════════════════════════════════
-- Critical fixes from the full-platform audit (2026-09-10)
--
-- 1. assessments_insert only checked that *some* paid payment exists for the
--    child, not a fresh unconsumed one — one payment unlocked every future
--    assessment on that child, forever. Now a paid payment is only good for
--    one assessment (count of paid payments must exceed count of assessments
--    already created for the child).
-- 2. mv_admin, cr_admin, item_overrides_admin were `using (public.is_admin())`
--    only — the exact hole 0003_security_fixes.sql closed for every other
--    staff table, never backported to these three. Any admin_user of any
--    role could edit the question bank / milestone videos / course
--    recommendations regardless of page grants.
-- 3. item_overrides_read was `using (true)` — no auth check at all. The
--    entire question-bank overlay was readable by anyone holding the public
--    anon key, signed in or not.
-- 4. schools_self_read had the same missing has_page_access() gap — any
--    admin, any role, could read every school's contact details.
-- 5. assessments_update / responses_update only checked child ownership, not
--    assessment status — a completed assessment's answers could still be
--    rewritten after its report was issued.
-- 6. deleteAssessment() (lib/data/assessments.ts) has existed since day one
--    with no matching DELETE policy on assessments or responses — the call
--    silently deleted zero rows.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. a paid payment is only good for one assessment ─────────────────────

drop policy if exists assessments_insert on assessments;
create policy assessments_insert on assessments
  for insert with check (
    exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
    and (
      select count(*) from payments p
      where p.child_id = assessments.child_id and p.profile_id = auth.uid() and p.status = 'paid'
    ) > (
      select count(*) from assessments a2
      where a2.child_id = assessments.child_id
    )
  );


-- ─── 2 & 3. backport has_page_access() gating to the tables 0003 missed ────

drop policy if exists mv_admin on milestone_videos;
create policy mv_admin on milestone_videos
  for all using (public.is_admin() and public.has_page_access('milestone-videos'));

drop policy if exists cr_admin on course_recommendations;
create policy cr_admin on course_recommendations
  for all using (public.is_admin() and public.has_page_access('courses'));

drop policy if exists item_overrides_admin on item_overrides;
create policy item_overrides_admin on item_overrides
  for all using (public.is_admin() and public.has_page_access('item-bank'));

drop policy if exists item_overrides_read on item_overrides;
create policy item_overrides_read on item_overrides
  for select using (auth.uid() is not null);


-- ─── 4. schools: same gap ────────────────────────────────────────────────

drop policy if exists schools_self_read on schools;
create policy schools_self_read on schools
  for select using (id = auth.uid() or (public.is_admin() and public.has_page_access('schools')));


-- ─── 5. lock a completed assessment against further edits ──────────────────
-- The USING clause is evaluated against the row's state before the update,
-- so completeAssessment()'s own in_progress → complete transition is
-- unaffected — it still runs while status is still 'in_progress'.

drop policy if exists assessments_update on assessments;
create policy assessments_update on assessments
  for update using (
    status = 'in_progress'
    and exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
  );

drop policy if exists responses_update on responses;
create policy responses_update on responses
  for update using (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id and c.profile_id = auth.uid()
               and a.status = 'in_progress')
  );


-- ─── 6. deleteAssessment() needs somewhere to actually delete from ─────────

create policy assessments_delete on assessments
  for delete using (
    exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
  );

create policy responses_delete on responses
  for delete using (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id and c.profile_id = auth.uid())
  );
