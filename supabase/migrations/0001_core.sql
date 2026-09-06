-- ═══════════════════════════════════════════════════════════════════════════
-- Kaushalya Genius Kid — core schema
--
-- THE SHAPE, IN ONE PARAGRAPH
--
--   auth.users ──1:1── profiles (the parent)
--                        ├──1:1── leads          (the parent IS the lead)
--                        └──1:N── children
--                                   └──1:N── assessments
--                                              └──1:N── responses
--   leads ──1:N── interactions   (the call log; drives follow-up state)
--   profiles ──1:N── payments
--
-- A lead belongs to a PARENT, never to a child. A parent can have many
-- children; each child can have many assessments. This is the relationship
-- the whole sales workflow depends on, so it is enforced here in the
-- database rather than assembled hopefully in application code.
--
-- WHY CONTENT ISN'T HERE
--
-- The question bank (brain stages, competences, items) deliberately still
-- lives in version-controlled TypeScript under content/ — it is a clinical
-- instrument, and having it reviewable in git beats having it editable by a
-- stray click. `responses.item_id` is therefore a TEXT key matching those
-- ids ("s5-vision-01"), not a foreign key. Moving the bank into Postgres is
-- a deliberate later step, not an oversight.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── staff ─────────────────────────────────────────────────────────────────

create table admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  role        text not null default 'sales'
                check (role in ('super_admin', 'sales', 'content_editor')),
  created_at  timestamptz not null default now()
);

-- Used by every admin-facing RLS policy below. SECURITY DEFINER so the
-- policy can read admin_users without the caller needing rights to it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─── the parent ────────────────────────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  phone       text not null default '',
  email       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_touch before update on profiles
  for each row execute function public.touch_updated_at();


-- ─── the lead ──────────────────────────────────────────────────────────────
--
-- Exactly one row per parent. The UNIQUE on profile_id is what makes a page
-- refresh, a second login, or a second child incapable of producing a
-- duplicate lead — the guarantee is structural, not a code convention.

create table leads (
  id                   uuid primary key default gen_random_uuid(),
  profile_id           uuid not null unique references profiles (id) on delete cascade,
  status               text not null default 'new'
                         check (status in ('new', 'contacted', 'interested',
                                           'follow_up', 'converted',
                                           'not_interested', 'lost')),
  source               text not null default 'signup',
  assigned_to          uuid references admin_users (id) on delete set null,
  -- Denormalised from the newest interaction so the leads list can sort and
  -- filter on them without a per-row subquery. Kept honest by the trigger
  -- below, never written by hand.
  next_follow_up_at    timestamptz,
  last_interaction_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index leads_follow_up  on leads (next_follow_up_at) where next_follow_up_at is not null;
create index leads_status     on leads (status);
create index leads_assigned   on leads (assigned_to);

create trigger leads_touch before update on leads
  for each row execute function public.touch_updated_at();


-- ─── children ──────────────────────────────────────────────────────────────

create table children (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references profiles (id) on delete cascade,
  name               text not null,
  dob                date not null,
  gender             text not null default 'other'
                       check (gender in ('girl', 'boy', 'other')),
  gestational_weeks  smallint check (gestational_weeks between 22 and 42),
  city               text,
  photo_url          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index children_by_parent on children (profile_id, created_at desc);

create trigger children_touch before update on children
  for each row execute function public.touch_updated_at();


-- ─── assessments ───────────────────────────────────────────────────────────

create table assessments (
  id                uuid primary key default gen_random_uuid(),
  child_id          uuid not null references children (id) on delete cascade,
  assessed_on       date not null default current_date,
  -- The stage the child's corrected age opened on (content/stages.ts id).
  start_stage       text not null,
  -- Stages actually presented per competence, in ladder-walk order:
  -- { "vision": ["s5","s6"], "language": ["s5","s4","s3"], ... }
  stages_by_domain  jsonb not null default '{}'::jsonb,
  -- Non-scoring observations the booklet records (counts, "which hand",
  -- free text), keyed by item id.
  details           jsonb not null default '{}'::jsonb,
  status            text not null default 'in_progress'
                      check (status in ('in_progress', 'complete')),
  bank_version      text not null default '',
  share_token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index assessments_by_child on assessments (child_id, created_at desc);
create index assessments_status   on assessments (status);


-- ─── responses ─────────────────────────────────────────────────────────────

create table responses (
  assessment_id  uuid not null references assessments (id) on delete cascade,
  -- Matches an id in content/items.ts, e.g. "s5-vision-01". See header note.
  item_id        text not null,
  -- Strictly yes/no: the booklet is, and so is the engine. 1 = yes, 0 = no.
  value          smallint not null check (value in (0, 1)),
  answered_at    timestamptz not null default now(),
  primary key (assessment_id, item_id)
);


-- ─── interactions (the call log) ───────────────────────────────────────────

create table interactions (
  id                 uuid primary key default gen_random_uuid(),
  lead_id            uuid not null references leads (id) on delete cascade,
  occurred_at        timestamptz not null default now(),
  channel            text not null default 'phone'
                       check (channel in ('phone', 'whatsapp', 'email',
                                          'sms', 'in_person', 'other')),
  outcome            text not null
                       check (outcome in ('interested', 'not_interested',
                                          'call_back', 'info_requested',
                                          'payment_discussion',
                                          'assessment_discussion',
                                          'converted', 'no_response', 'other')),
  remarks            text not null default '',
  next_follow_up_at  timestamptz,
  logged_by          uuid references auth.users (id) on delete set null,
  created_at         timestamptz not null default now()
);

create index interactions_by_lead on interactions (lead_id, occurred_at desc);

-- The lead's follow-up state is derived from its newest interaction, never
-- typed in separately — that is how the two stay from drifting apart.
create or replace function public.sync_lead_after_interaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.leads
     set next_follow_up_at   = new.next_follow_up_at,
         last_interaction_at = new.occurred_at,
         status = case
           when new.outcome = 'converted'      then 'converted'
           when new.outcome = 'not_interested' then 'not_interested'
           when new.outcome in ('interested', 'payment_discussion',
                                'assessment_discussion', 'info_requested')
                                               then 'interested'
           when new.outcome in ('call_back', 'no_response')
                                               then 'follow_up'
           else 'contacted'
         end,
         updated_at = now()
   where id = new.lead_id;
  return new;
end;
$$;

create trigger interactions_sync_lead
  after insert on interactions
  for each row execute function public.sync_lead_after_interaction();


-- ─── payments ──────────────────────────────────────────────────────────────

create table payments (
  id                   uuid primary key default gen_random_uuid(),
  profile_id           uuid not null references profiles (id) on delete cascade,
  child_id             uuid references children (id) on delete set null,
  razorpay_order_id    text not null unique,
  razorpay_payment_id  text unique,
  razorpay_signature   text,
  -- Paise, because Razorpay speaks paise and floating-point money is a bug.
  amount_paise         integer not null check (amount_paise >= 0),
  currency             text not null default 'INR',
  status               text not null default 'created'
                         check (status in ('created', 'paid', 'failed', 'cancelled')),
  notes                jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  paid_at              timestamptz
);

create index payments_by_profile on payments (profile_id, created_at desc);


-- ─── signup: one account, one profile, one lead ────────────────────────────
--
-- Done as a trigger on auth.users rather than in the app: it cannot be
-- skipped by a client that forgets to call it, cannot half-succeed, and
-- cannot run twice for the same account.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Staff are created through the Supabase dashboard with a flag in their
  -- metadata. They are colleagues, not leads.
  if coalesce(new.raw_user_meta_data ->> 'is_admin', 'false') = 'true' then
    insert into public.admin_users (id, email, role)
    values (new.id,
            coalesce(new.email, ''),
            coalesce(new.raw_user_meta_data ->> 'role', 'sales'))
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
  values (new.id, 'new', 'signup')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════════════════
-- Row level security
--
-- Default posture: a parent sees their own family and nothing else; staff
-- see everything; nobody sees the sales pipeline except staff. Leads and
-- interactions have NO parent-facing policy at all — a parent should never
-- be able to read what sales wrote about them.
-- ═══════════════════════════════════════════════════════════════════════════

alter table admin_users  enable row level security;
alter table profiles     enable row level security;
alter table leads        enable row level security;
alter table children     enable row level security;
alter table assessments  enable row level security;
alter table responses    enable row level security;
alter table interactions enable row level security;
alter table payments     enable row level security;

-- staff
create policy admin_self_read on admin_users
  for select using (id = auth.uid() or public.is_admin());

-- parent profile
create policy profiles_read on profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update on profiles
  for update using (id = auth.uid());

-- leads: staff only, in both directions
create policy leads_admin_read   on leads for select using (public.is_admin());
create policy leads_admin_update on leads for update using (public.is_admin());

-- children
create policy children_read on children
  for select using (profile_id = auth.uid() or public.is_admin());
create policy children_insert on children
  for insert with check (profile_id = auth.uid());
create policy children_update on children
  for update using (profile_id = auth.uid());
create policy children_delete on children
  for delete using (profile_id = auth.uid());

-- assessments, through the child
create policy assessments_read on assessments
  for select using (
    exists (select 1 from children c
             where c.id = assessments.child_id
               and (c.profile_id = auth.uid() or public.is_admin()))
  );
create policy assessments_insert on assessments
  for insert with check (
    exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
  );
create policy assessments_update on assessments
  for update using (
    exists (select 1 from children c
             where c.id = assessments.child_id and c.profile_id = auth.uid())
  );

-- responses, through the assessment
create policy responses_read on responses
  for select using (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id
               and (c.profile_id = auth.uid() or public.is_admin()))
  );
create policy responses_write on responses
  for insert with check (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id and c.profile_id = auth.uid())
  );
create policy responses_update on responses
  for update using (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id and c.profile_id = auth.uid())
  );

-- interactions: staff only
create policy interactions_admin_read  on interactions for select using (public.is_admin());
create policy interactions_admin_write on interactions for insert with check (public.is_admin());

-- payments: a parent may read their own; only the server (service role,
-- which bypasses RLS) ever writes one.
create policy payments_read on payments
  for select using (profile_id = auth.uid() or public.is_admin());
