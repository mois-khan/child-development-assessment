-- Kaushalya Kids Genius — development screener
--
-- The POC persists to localStorage so it runs with no credentials. This is the
-- schema it is shaped around: switching over means replacing the six functions
-- in lib/store.ts with Supabase queries, nothing else.
--
-- Two decisions are baked in deliberately:
--
--   1. Content is data. Domains, bands, items and activities are rows, so the
--      child development team edits them without a deploy.
--   2. Assessments are immutable snapshots. Each one records the item bank
--      version it used and stores its own computed scores, so a report from
--      March still renders identically in December after the questions have
--      been rewritten.

create extension if not exists "pgcrypto";

-- ─── content ───────────────────────────────────────────────────────────────

create table domains (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        jsonb not null,          -- { "en": "...", "hi": "...", "kn": "..." }
  blurb       jsonb not null,
  scope       text,
  hue         smallint not null,
  sort_order  smallint not null,
  is_active   boolean not null default true
);

create table age_bands (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,    -- b01 … b13
  label       text not null,
  min_months  smallint not null,
  max_months  smallint not null,       -- inclusive
  sort_order  smallint not null,
  constraint age_bands_range check (max_months >= min_months)
);

create table items (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,         -- b08-language-01
  domain_id     uuid not null references domains (id) on delete restrict,
  band_id       uuid not null references age_bands (id) on delete restrict,
  text          jsonb not null,
  how_to_check  jsonb not null,        -- so the parent tests rather than recalls
  source        text not null check (source in ('CDC', 'NIDCD', 'WHO', 'AUTHORED')),
  sort_order    smallint not null default 0,
  bank_version  text not null,
  is_active     boolean not null default true,
  unique (code, bank_version)
);

create index items_lookup on items (band_id, domain_id) where is_active;

create table activities (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  domain_id    uuid not null references domains (id) on delete restrict,
  stage        text not null,          -- s1 … s6
  title        jsonb not null,
  description  jsonb not null,
  materials    text not null,
  minutes      smallint not null default 10,
  frequency    text not null,
  priority     smallint not null default 0,
  is_active    boolean not null default true
);

-- Lets a specific missing skill drive a specific suggestion, rather than the
-- report only ever offering generic advice for the domain.
create table item_activities (
  item_id      uuid not null references items (id) on delete cascade,
  activity_id  uuid not null references activities (id) on delete cascade,
  primary key (item_id, activity_id)
);

-- ─── assessment records ────────────────────────────────────────────────────

create table children (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  dob                date not null,
  gender             text check (gender in ('girl', 'boy', 'other')),
  gestational_weeks  smallint check (gestational_weeks between 22 and 42),
  parent_email       text,
  created_at         timestamptz not null default now()
);

create table assessments (
  id                    uuid primary key default gen_random_uuid(),
  child_id              uuid not null references children (id) on delete cascade,
  assessed_on           date not null,
  chronological_months  smallint not null,
  -- Corrected age for babies born before 37 weeks. Scoring uses this.
  assessed_months       smallint not null,
  corrected             boolean not null default false,
  bank_version          text not null,
  -- Bands presented per domain, including anything the adaptive rounds added.
  bands_by_domain       jsonb not null,
  status                text not null default 'in_progress'
                          check (status in ('in_progress', 'complete')),
  share_token           text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

create index assessments_by_child on assessments (child_id, assessed_on desc);

create table responses (
  assessment_id  uuid not null references assessments (id) on delete cascade,
  item_id        uuid not null references items (id) on delete restrict,
  -- 2 yes, 1 sometimes, 0 not yet. Unanswered items are simply absent, and are
  -- left out of the denominator rather than counted as zero.
  value          smallint not null check (value between 0 and 2),
  answered_at    timestamptz not null default now(),
  primary key (assessment_id, item_id)
);

create table domain_scores (
  assessment_id         uuid not null references assessments (id) on delete cascade,
  domain_id             uuid not null references domains (id) on delete restrict,
  raw                   smallint not null,
  max                   smallint not null,
  percent               numeric(5, 4) not null,
  developmental_months  numeric(5, 2) not null,
  -- Null under four months old, where the ratio is too unstable to report.
  dq                    smallint,
  bounded               text check (bounded in ('floor', 'ceiling')),
  status                text not null
                          check (status in ('on_track', 'emerging', 'needs_focus', 'consult')),
  primary key (assessment_id, domain_id)
);

create table results (
  assessment_id      uuid primary key references assessments (id) on delete cascade,
  overall_dq         smallint,
  overall_status     text not null
                       check (overall_status in ('on_track', 'emerging', 'needs_focus', 'consult')),
  -- Set when one weak domain forced the overall status below what the average
  -- alone would give, so the report can explain itself.
  raised_by_domain   uuid references domains (id),
  strengths          text[] not null default '{}',
  focus_areas        text[] not null default '{}',
  suppress_dq        boolean not null default false,
  narrative          jsonb,
  created_at         timestamptz not null default now()
);

-- ─── access ────────────────────────────────────────────────────────────────
--
-- This is children's health-adjacent data. Reports are reachable only by their
-- exact share token, and nothing enumerates children. Getting this right at the
-- start is far cheaper than auditing it later.

alter table children      enable row level security;
alter table assessments   enable row level security;
alter table responses     enable row level security;
alter table domain_scores enable row level security;
alter table results       enable row level security;

-- Content is world-readable; only service-role writes it.
alter table domains         enable row level security;
alter table age_bands       enable row level security;
alter table items           enable row level security;
alter table activities      enable row level security;
alter table item_activities enable row level security;

create policy content_readable on domains         for select using (true);
create policy content_readable on age_bands       for select using (true);
create policy content_readable on items           for select using (true);
create policy content_readable on activities      for select using (true);
create policy content_readable on item_activities for select using (true);

-- Reports open by token only. Set via `set_config('request.share_token', ...)`
-- from an edge function or a server action; never expose the table directly.
create policy assessment_by_token on assessments for select
  using (share_token = current_setting('request.share_token', true));

create policy results_by_token on results for select
  using (exists (
    select 1 from assessments a
    where a.id = results.assessment_id
      and a.share_token = current_setting('request.share_token', true)
  ));

create policy domain_scores_by_token on domain_scores for select
  using (exists (
    select 1 from assessments a
    where a.id = domain_scores.assessment_id
      and a.share_token = current_setting('request.share_token', true)
  ));

create policy responses_by_token on responses for select
  using (exists (
    select 1 from assessments a
    where a.id = responses.assessment_id
      and a.share_token = current_setting('request.share_token', true)
  ));

create policy child_by_token on children for select
  using (exists (
    select 1 from assessments a
    where a.child_id = children.id
      and a.share_token = current_setting('request.share_token', true)
  ));
