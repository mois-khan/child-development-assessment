-- Fix the assessments_update policy which accidentally prevented changing status to complete
drop policy if exists assessments_update on assessments;
create policy assessments_update on assessments
  for update using (
    status = 'in_progress'
    and exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
  ) with check (
    exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
  );
