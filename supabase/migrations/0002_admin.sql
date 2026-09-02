-- Kaushalya Kids Genius — admin portal & accounts
--
-- Adds what 0001_init.sql deliberately left out: admin users, real parent
-- accounts, a draft/publish lifecycle for content, and the video/course
-- layer the admin portal manages.
--
-- Draft/publish model: editable content (items, activities, courses,
-- recommendation_rules) now carries `bank_version` = 'draft' while an admin
-- is working on it. Publishing copies the current draft rows forward under a
-- new immutable version id and flags it current; an assessment created after
-- that point stamps itself with the new version, and — per 0001's own
-- design — never moves off it. Draft edits never touch a version a live
-- assessment already points to.

-- ─── admin accounts ────────────────────────────────────────────────────────

create table admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  role        text not null default 'content_editor'
                check (role in ('super_admin', 'content_editor', 'support')),
  created_at  timestamptz not null default now()
);

-- ─── real parent accounts ──────────────────────────────────────────────────
-- Kept alongside the existing share_token model (0001), not instead of it —
-- a report link still works with no account, for sharing with a doctor or
-- grandparent. This just lets a signed-in parent see all of their children
-- in one place instead of relying on a browser's local storage.

alter table children add column owner_id uuid references auth.users (id) on delete cascade;
create index children_by_owner on children (owner_id);

-- ─── content versioning ─────────────────────────────────────────────────────

create table item_bank_versions (
  version       text primary key,
  status        text not null default 'draft' check (status in ('draft', 'published')),
  is_current    boolean not null default false,
  created_at    timestamptz not null default now(),
  published_at  timestamptz,
  published_by  uuid references admin_users (id)
);

-- Exactly one published version may be "current" at a time.
create unique index one_current_version on item_bank_versions (is_current) where is_current;

insert into item_bank_versions (version, status) values ('draft', 'draft');

-- ─── videos ─────────────────────────────────────────────────────────────────

create table videos (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  provider          text not null check (provider in ('youtube', 'vimeo', 'mp4')),
  url               text not null,
  -- Left null to auto-derive from the provider (e.g. YouTube's thumbnail
  -- endpoint) unless an admin overrides it.
  thumbnail_url     text,
  duration_seconds  smallint,
  alt_text          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- An activity can now point at a suggested video, not just text instructions.
alter table activities add column video_id uuid references videos (id) on delete set null;
alter table activities add column bank_version text not null default 'draft' references item_bank_versions (version);

-- items.bank_version (0001) stays a free-text stamp rather than an FK to
-- item_bank_versions: it is the immutable per-row version an assessment
-- freezes to, and needs to keep working even for a bank_version string
-- minted before item_bank_versions existed (e.g. the POC seed's
-- "2026.09.01-poc"). New draft edits use bank_version = 'draft'.

-- ─── courses & recommendations ──────────────────────────────────────────────

create table courses (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  title          jsonb not null,
  description    jsonb not null,
  price          numeric(10, 2),
  currency       text not null default 'INR',
  thumbnail_url  text,
  checkout_url   text,
  is_active      boolean not null default true,
  bank_version   text not null default 'draft' references item_bank_versions (version),
  created_at     timestamptz not null default now()
);

-- Drives the report's "Recommended next" section. A condition is evaluated
-- against one child's AssessmentResult (domain + status, or the overall
-- raised-by domain); the highest-priority match wins.
create table recommendation_rules (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references courses (id) on delete cascade,
  domain_id      uuid references domains (id) on delete cascade,  -- null = any domain
  status         text check (status in ('on_track', 'emerging', 'needs_focus', 'consult')),
  priority       smallint not null default 0,
  is_active      boolean not null default true,
  bank_version   text not null default 'draft' references item_bank_versions (version),
  created_at     timestamptz not null default now()
);

create index recommendation_rules_lookup
  on recommendation_rules (domain_id, status) where is_active;

-- ─── audit log ────────────────────────────────────────────────────────────
-- Every admin write to content lands here. Health-adjacent report content
-- changing silently is the one failure mode worth over-engineering against.

create table audit_log (
  id          bigint generated always as identity primary key,
  admin_id    uuid references admin_users (id),
  table_name  text not null,
  row_id      text not null,
  action      text not null check (action in ('insert', 'update', 'delete', 'publish')),
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);

create index audit_log_by_row on audit_log (table_name, row_id, created_at desc);

-- ─── access ───────────────────────────────────────────────────────────────

alter table admin_users           enable row level security;
alter table item_bank_versions    enable row level security;
alter table videos                enable row level security;
alter table courses               enable row level security;
alter table recommendation_rules  enable row level security;
alter table audit_log             enable row level security;

-- Admins can see their own row (enough to check role client-side); writes to
-- every admin-owned table happen through the service role from the admin
-- portal's server actions, not directly from an authenticated browser client.
create policy admin_self_read on admin_users for select using (id = auth.uid());

-- Published content is world-readable, same as domains/items/activities in
-- 0001 — the parent-facing report needs to read the current course and
-- recommendation rules without an admin session.
create policy videos_readable on videos for select using (true);
create policy courses_readable on courses for select
  using (is_active and bank_version = (select version from item_bank_versions where is_current));
create policy recommendation_rules_readable on recommendation_rules for select
  using (is_active and bank_version = (select version from item_bank_versions where is_current));

-- A signed-in parent manages only their own children; report/assessment
-- access by share_token (0001) keeps working unchanged alongside this.
create policy children_owned on children for select using (owner_id = auth.uid());
create policy children_owned_write on children for insert with check (owner_id = auth.uid());
create policy children_owned_update on children for update using (owner_id = auth.uid());
