-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics engine — the channel dimension
--
-- THE BUG THIS FIXES
--
--   The admin funnel counted leads, then children, then assessments, and
--   divided each step by the one before it. But a school account gets no
--   `leads` row on purpose (0007_schools.sql: an admin invite means the deal
--   already closed), while its students are ordinary `children` rows. So the
--   numerator counted school students and the denominator didn't — "added a
--   child" could read 300% of leads, and every downstream rate was drawn
--   from two different populations.
--
--   Nothing was miscalculated. A dimension was missing: whether a row
--   belongs to a family or to a school roster. That fact lived one join away
--   on profiles.account_type and nothing downstream ever asked for it.
--
-- THE SHAPE
--
--   account_channel(profile_id) → 'direct' | 'school', the single definition
--   of that split. Three views carry it alongside the facts, and the
--   aggregation stays in lib/admin/analytics.ts where a metric's definition
--   is readable next to the UI that renders it.
--
-- WHY THESE VIEWS ARE NOT security_invoker
--
--   Under RLS-as-caller, reading the funnel would require an admin to hold
--   'children' AND 'assessments' AND 'purchases' page grants at once — miss
--   one and the join silently returns zero rows, which reads as "no data"
--   rather than "no access". Worse, it makes a business-summary permission
--   depend on holding row-level access to the underlying records.
--
--   So each view runs as its owner and guards itself with an explicit
--   is_admin() + has_page_access('analytics') check. That makes "can see
--   business numbers" one deliberate grant. It is safe to do here precisely
--   because these views carry no personal data — ids, timestamps, enums and
--   amounts only. No name, no email, no phone, no date of birth. Anything
--   identifying stays behind its own page grant, where it belongs.
--
--   Keep that property. A column added here that names a human turns an
--   aggregate view into a PII leak.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── the classification ────────────────────────────────────────────────────
--
-- SECURITY DEFINER for the same reason is_admin() and is_school() are: a
-- caller must be able to classify a profile without holding read rights on
-- the schools table. It answers exactly one question and leaks nothing
-- beyond it.

create or replace function public.account_channel(p_profile_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.schools s where s.id = p_profile_id)
      then 'school'
    else 'direct'
  end;
$$;

comment on function public.account_channel(uuid) is
  'direct: an individual family, the self-signup B2C path that has a leads '
  'row. school: a student on an institutional roster, provisioned by admin '
  'invite and deliberately outside the sales funnel. The single definition '
  'of that split — do not re-derive it anywhere else.';


-- ─── guard ─────────────────────────────────────────────────────────────────

create or replace function public.can_read_analytics()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() and public.has_page_access('analytics');
$$;


-- ─── leads ─────────────────────────────────────────────────────────────────
--
-- Always channel 'direct' — a school never gets a leads row, which is the
-- whole reason the old funnel divided school students by a parent-only
-- denominator. Stated here as a column anyway so a caller reading this view
-- never has to remember the exception.
--
-- first_interaction_at is the one derived field worth carrying: signup to
-- first contact is usually the strongest single predictor of conversion in
-- an inside-sales business, and it is a subquery nobody should rewrite.

create or replace view public.analytics_leads as
select
  l.id,
  l.profile_id,
  'direct'::text                                             as channel,
  l.status,
  l.source,
  l.assigned_to,
  l.next_follow_up_at,
  l.last_interaction_at,
  (select min(i.occurred_at) from public.interactions i where i.lead_id = l.id) as first_interaction_at,
  (select count(*)          from public.interactions i where i.lead_id = l.id) as interaction_count,
  l.created_at
from public.leads l
where public.can_read_analytics();


-- ─── children ──────────────────────────────────────────────────────────────

create or replace view public.analytics_children as
select
  c.id,
  c.profile_id,
  public.account_channel(c.profile_id)                       as channel,
  case when public.account_channel(c.profile_id) = 'school'
       then c.profile_id end                                 as school_id,
  -- Age in months at creation, not the date of birth itself: the age band is
  -- what analysis needs and a DOB is identifying.
  (extract(year  from age(c.created_at::date, c.dob)) * 12
 + extract(month from age(c.created_at::date, c.dob)))::int   as age_months_at_signup,
  c.gender,
  c.city,
  c.created_at
from public.children c
where public.can_read_analytics();


-- ─── schools ───────────────────────────────────────────────────────────────
--
-- Counted from the schools table rather than from distinct school_ids on the
-- roster, because a school with nobody on its roster is the single most
-- important school to see: it is a signed contract that never activated, and
-- deriving the count from children would hide exactly that case.

create or replace view public.analytics_schools as
select
  s.id,
  s.city,
  s.created_at
from public.schools s
where public.can_read_analytics();


-- ─── assessments ───────────────────────────────────────────────────────────
--
-- last_answered_at is what separates "abandoned" from "still going". The old
-- drop-off chart counted every unfinished assessment as a drop-off, so one
-- started ten minutes ago was indistinguishable from one left in March.

create or replace view public.analytics_assessments as
select
  a.id,
  a.child_id,
  c.profile_id,
  public.account_channel(c.profile_id)                       as channel,
  a.status,
  a.start_stage,
  a.stages_by_domain,
  -- Scored against a superseded item bank: never pool these into a trend
  -- with current results, they came off a different instrument.
  a.bank_version,
  a.created_at,
  a.completed_at,
  (select max(r.answered_at) from public.responses r where r.assessment_id = a.id) as last_answered_at,
  (select count(*)          from public.responses r where r.assessment_id = a.id) as answered_count
from public.assessments a
join public.children c on c.id = a.child_id
where public.can_read_analytics();


-- ─── payments ──────────────────────────────────────────────────────────────
--
-- `kind` is the distinction the old funnel could not make: a coupon
-- redemption is a payments row with amount_paise = 0 (see
-- app/api/payments/coupon), so counting paid rows counted give-aways as
-- sales. Rows left at 'created' are abandoned or failed checkouts — the
-- revenue leak nothing surfaced before.

create or replace view public.analytics_payments as
select
  p.id,
  p.profile_id,
  p.child_id,
  public.account_channel(p.profile_id)                       as channel,
  p.amount_paise,
  p.status,
  case when p.amount_paise = 0 then 'coupon' else 'cash' end as kind,
  p.notes ->> 'method'                                       as method,
  p.created_at,
  p.paid_at
from public.payments p
where public.can_read_analytics();


-- ─── events ────────────────────────────────────────────────────────────────
--
-- Everything above is inferred from state the app already keeps. Two things
-- cannot be: whether a parent ever SAW the paywall (a child with no payment
-- row may simply never have opened /pay), and whether a finished report was
-- ever opened. Both are answers the state tables structurally cannot give,
-- so they get recorded as they happen.
--
-- Deliberately thin. `name` is free text rather than a check constraint so
-- adding an event never needs a migration; the cost is that a typo makes a
-- new event name rather than an error, which is why the names in use are
-- listed in lib/analytics/events.ts and nowhere else.

create table if not exists public.analytics_events (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid references public.profiles (id)    on delete cascade,
  child_id       uuid references public.children (id)    on delete set null,
  assessment_id  uuid references public.assessments (id) on delete set null,
  name           text not null,
  props          jsonb not null default '{}'::jsonb,
  occurred_at    timestamptz not null default now()
);

create index if not exists analytics_events_name_time
  on public.analytics_events (name, occurred_at desc);
create index if not exists analytics_events_by_profile
  on public.analytics_events (profile_id, occurred_at desc);

alter table public.analytics_events enable row level security;

-- A signed-in account may record its own activity and nothing else — the
-- profile_id is checked against the session rather than trusted from the
-- request, so a client cannot write events attributed to someone else.
create policy analytics_events_own_insert on public.analytics_events
  for insert with check (profile_id = auth.uid());

-- Write-only for the account that produced it: a parent has no reason to
-- read the behavioural log, and staff read it only with the analytics grant.
create policy analytics_events_admin_read on public.analytics_events
  for select using (public.can_read_analytics());


-- ─── lead source ───────────────────────────────────────────────────────────
--
-- leads.source has existed since 0001 and has held the literal 'signup' on
-- every row ever created, because handle_new_user() hardcoded it. Reading it
-- from signup metadata instead makes conversion-by-channel answerable;
-- app/join passes whatever utm_source the visitor arrived with.
--
-- CREATE OR REPLACE on the function 0007_schools.sql last defined, so the
-- existing on_auth_user_created trigger keeps pointing at it. The staff and
-- school branches are unchanged and reproduced verbatim.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'is_admin', 'false') = 'true' then
    insert into public.admin_users (id, email, role)
    values (new.id,
            coalesce(new.email, ''),
            coalesce(new.raw_user_meta_data ->> 'role', 'sales'))
    on conflict (id) do nothing;
    return new;
  end if;

  if coalesce(new.raw_user_meta_data ->> 'account_type', 'parent') = 'school' then
    insert into public.profiles (id, full_name, phone, email, account_type)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
            coalesce(new.raw_user_meta_data ->> 'contact_phone', ''),
            coalesce(new.email, ''),
            'school')
    on conflict (id) do nothing;

    insert into public.schools (id, school_name, contact_name, contact_phone)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'school_name', ''),
            coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
            coalesce(new.raw_user_meta_data ->> 'contact_phone', ''))
    on conflict (id) do nothing;

    return new;
  end if;

  insert into public.profiles (id, full_name, phone, email)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          coalesce(new.raw_user_meta_data ->> 'phone', ''),
          coalesce(new.email, ''))
  on conflict (id) do nothing;

  insert into public.leads (profile_id, status, source)
  values (new.id,
          'new',
          -- nullif guards the empty string a form sends when the field was
          -- present but blank, which coalesce alone would happily store.
          coalesce(nullif(new.raw_user_meta_data ->> 'source', ''), 'signup'))
  on conflict (profile_id) do nothing;

  return new;
end;
$$;


-- ─── the analytics grant ───────────────────────────────────────────────────
--
-- 0012 registered this page for the standalone /admin/analytics route, which
-- is now a redirect — the funnel lives on the dashboard. The grant outlived
-- the route and now gates the views above, so its description should say so.

insert into public.admin_pages (id, label, description, sort_order) values
  ('analytics', 'Analytics', 'Business funnel, conversion and behaviour numbers', 12)
on conflict (id) do update set description = excluded.description;
