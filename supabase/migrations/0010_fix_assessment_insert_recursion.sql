-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: 0009's assessments_insert policy broke assessment creation entirely
--
-- The WITH CHECK clause counted existing assessments for the same child via
-- a subquery on `assessments` — from inside an INSERT policy on `assessments`
-- itself. Postgres rejects that outright as infinite recursion (42P17): a
-- self-referencing subquery in a policy on the same relation it's attached
-- to isn't something RLS can evaluate. This was caught by end-to-end
-- verification immediately after 0009 shipped, before it affected a real
-- payment — no user was actually blocked in production.
--
-- Fix: move the "one paid payment, one assessment" check into a BEFORE
-- INSERT trigger instead of the RLS policy. A trigger function's internal
-- queries run as the function owner (table owner bypasses RLS by default,
-- same reason is_admin()/has_page_access() can read admin_users without the
-- caller needing rights to it) — so counting existing assessments here isn't
-- subject to the policy being evaluated on the row currently being inserted,
-- and the recursion never happens.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists assessments_insert on assessments;
create policy assessments_insert on assessments
  for insert with check (
    exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
  );

create or replace function public.enforce_assessment_payment_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from payments p
    where p.child_id = new.child_id and p.status = 'paid'
  ) <= (
    select count(*) from assessments a2
    where a2.child_id = new.child_id
  ) then
    raise exception 'No unconsumed paid payment for this child'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists assessments_payment_gate on assessments;
create trigger assessments_payment_gate
  before insert on assessments
  for each row execute function public.enforce_assessment_payment_gate();
