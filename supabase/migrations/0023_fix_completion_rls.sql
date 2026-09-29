-- ═══════════════════════════════════════════════════════════════════════════
-- Fix assessments UPDATE policy to allow both parents and admins to
-- update an assessment, including marking it complete.
--
-- The previous policy in 0022 had a USING clause that restricted updates to
-- rows where status = 'in_progress'. While this is technically correct
-- (the USING clause is checked against the existing row), it was added
-- defensively when the real issue was that admins could not complete
-- assessments. This migration removes the status restriction from USING
-- entirely — ownership is the only gate — while keeping admin access.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists assessments_update on assessments;

create policy assessments_update on assessments
  for update
  using (
    exists (
      select 1 from public.children c
      where c.id = assessments.child_id
        and (c.profile_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.children c
      where c.id = assessments.child_id
        and (c.profile_id = auth.uid() or public.is_admin())
    )
  );
