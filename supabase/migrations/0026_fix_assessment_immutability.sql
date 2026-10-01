-- ═══════════════════════════════════════════════════════════════════════════
-- Fix assessments immutability and responses RLS
--
-- 1. 0023 accidentally removed the `status = 'in_progress'` lock for parents 
--    when updating an assessment. This restores it for parents while leaving 
--    admins the ability to update completed assessments.
-- 2. 0009 missed adding `public.is_admin()` to responses_update.
-- 3. responses_write (insert) didn't check if the assessment was in_progress.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists assessments_update on assessments;
create policy assessments_update on assessments
  for update
  using (
    (status = 'in_progress' or public.is_admin())
    and exists (
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

drop policy if exists responses_update on responses;
create policy responses_update on responses
  for update using (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id 
               and (c.profile_id = auth.uid() or public.is_admin())
               and (a.status = 'in_progress' or public.is_admin()))
  );

drop policy if exists responses_write on responses;
create policy responses_write on responses
  for insert with check (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id 
               and (c.profile_id = auth.uid() or public.is_admin())
               and (a.status = 'in_progress' or public.is_admin()))
  );

drop policy if exists responses_delete on responses;
create policy responses_delete on responses
  for delete using (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id 
               and (c.profile_id = auth.uid() or public.is_admin()))
  );
