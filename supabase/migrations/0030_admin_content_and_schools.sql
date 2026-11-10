-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0030: Add 'content' to admin_pages and exempt schools/admins from payment gate
--
-- 1. admin_pages registry:
--    Registers /admin/content ('content') in admin_pages so role-based page
--    access and staff permissions can be assigned to it, closing the security gap
--    in middleware.ts PAGE_GATE.
--
-- 2. enforce_assessment_payment_gate():
--    Updates the payment gate trigger on assessments to allow:
--    a) Admins (via is_admin())
--    b) Institutional school accounts (account_type = 'school' or is_school())
--    to create student assessments without requiring individual Razorpay payment records.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.admin_pages (id, label, description, sort_order)
values ('content', 'Report Narratives', 'CMS for report summaries and disclaimers', 12)
on conflict (id) do update
set label = excluded.label,
    description = excluded.description;

create or replace function public.enforce_assessment_payment_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_type text;
begin
  -- 1. Admins always bypass payment gate
  if public.is_admin() then
    return new;
  end if;

  -- 2. Institutional school accounts bypass payment gate
  if public.is_school() then
    return new;
  end if;

  -- Check if the child's owning profile is a school
  select pr.account_type into v_account_type
  from public.children c
  join public.profiles pr on pr.id = c.profile_id
  where c.id = new.child_id;

  if v_account_type = 'school' then
    return new;
  end if;

  -- 3. Individual parent accounts: must have unconsumed paid payment
  if (
    select count(*) from public.payments p
    where p.child_id = new.child_id and p.status = 'paid'
  ) <= (
    select count(*) from public.assessments a2
    where a2.child_id = new.child_id
  ) then
    raise exception 'No unconsumed paid payment for this child'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
