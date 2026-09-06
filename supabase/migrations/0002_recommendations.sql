-- ═══════════════════════════════════════════════════════════════════════════
-- Kaushalya Genius Kid — recommendation system + RBAC extensions
--
-- What this adds:
--   1. milestone_videos       — admin-curated video cards per (stage, domain)
--   2. course_recommendations — admin-curated course cards per overall stage
--   3. admin_pages            — registry of all admin panel pages
--   4. admin_page_access      — per-user page grants (super_admin bypasses)
--   5. has_page_access()      — used by middleware for page-level enforcement
--   6. admin_users.role       — constraint updated to the four real roles
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── update the role constraint on admin_users ─────────────────────────────
-- Previous: super_admin | sales | content_editor
-- New:      super_admin | admin | manager | sales

alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('super_admin', 'admin', 'manager', 'sales'));


-- ─── milestone_videos ──────────────────────────────────────────────────────
--
-- One or more short video cards per (stage_id, domain) cell.
-- stage_id matches content/stages.ts ids: "s1"…"s7".
-- domain matches DomainCode: vision | auditory | tactile | mobility | language | hand.
--
-- RLS: anyone can read (the report page is public); only admin can write.

create table public.milestone_videos (
  id             uuid        primary key default gen_random_uuid(),
  stage_id       text        not null,
  domain         text        not null
                               check (domain in ('vision','auditory','tactile',
                                                 'mobility','language','hand')),
  title          text        not null,
  description    text        not null default '',
  thumbnail_url  text        not null default '',
  redirect_url   text        not null,
  sort_order     smallint    not null default 0,
  is_active      boolean     not null default true,
  created_by     uuid        references public.admin_users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index milestone_videos_cell on public.milestone_videos (stage_id, domain, sort_order);

create trigger milestone_videos_touch
  before update on public.milestone_videos
  for each row execute function public.touch_updated_at();

alter table public.milestone_videos enable row level security;

create policy mv_read
  on public.milestone_videos for select using (true);

create policy mv_admin
  on public.milestone_videos for all using (public.is_admin());


-- ─── course_recommendations ────────────────────────────────────────────────
--
-- One or more course cards per overall brain stage.
-- stage_id matches content/stages.ts ids: "s1"…"s7".
-- Shown at the end of the report, after the oral summary.
--
-- RLS: anyone can read; only admin can write.

create table public.course_recommendations (
  id             uuid        primary key default gen_random_uuid(),
  stage_id       text        not null,
  title          text        not null,
  subtitle       text        not null default '',
  description    text        not null default '',
  thumbnail_url  text        not null default '',
  redirect_url   text        not null,
  age_label      text        not null default '',
  sort_order     smallint    not null default 0,
  is_active      boolean     not null default true,
  created_by     uuid        references public.admin_users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index course_recs_stage on public.course_recommendations (stage_id, sort_order);

create trigger course_recs_touch
  before update on public.course_recommendations
  for each row execute function public.touch_updated_at();

alter table public.course_recommendations enable row level security;

create policy cr_read
  on public.course_recommendations for select using (true);

create policy cr_admin
  on public.course_recommendations for all using (public.is_admin());


-- ─── admin_pages ───────────────────────────────────────────────────────────
--
-- A registry of every page that exists in the admin panel. The super_admin
-- sees all of them; everyone else is checked against admin_page_access.

create table public.admin_pages (
  id          text     primary key,
  label       text     not null,
  description text     not null default '',
  sort_order  smallint not null default 0
);

insert into public.admin_pages (id, label, description, sort_order) values
  ('dashboard',        'Dashboard',              'Overview and KPIs',                     1),
  ('parents',          'Parents',                'Parent profiles',                       2),
  ('children',         'Children',               'Child profiles',                        3),
  ('assessments',      'Assessments',            'Assessment records',                    4),
  ('leads',            'Leads',                  'Lead list and profiles',                5),
  ('item-bank',        'Question Bank',          'Manage assessment questions',           6),
  ('milestone-videos', 'Milestone Videos',       'CMS for milestone video cards',         7),
  ('courses',          'Course Recommendations', 'CMS for course recommendation cards',   8),
  ('purchases',        'Purchases',              'Payment and purchase records',          9),
  ('users',            'User Management',        'Manage admin users and permissions',   10);

alter table public.admin_pages enable row level security;

create policy ap_admin_read
  on public.admin_pages for select using (public.is_admin());


-- ─── admin_page_access ─────────────────────────────────────────────────────
--
-- Grants a specific admin user access to a specific page.
-- super_admin bypasses this table entirely (see has_page_access below).
-- The super_admin is the only role that may insert or delete rows here.

create table public.admin_page_access (
  admin_user_id  uuid        not null references public.admin_users (id) on delete cascade,
  page_id        text        not null references public.admin_pages  (id) on delete cascade,
  granted_at     timestamptz not null default now(),
  granted_by     uuid        references public.admin_users (id) on delete set null,
  primary key (admin_user_id, page_id)
);

create index apa_by_user on public.admin_page_access (admin_user_id);

alter table public.admin_page_access enable row level security;

-- Each admin can read their own grants; super_admin reads all.
create policy apa_read
  on public.admin_page_access for select
  using (admin_user_id = auth.uid() or public.is_admin());

-- Only super_admin may grant or revoke.
create policy apa_superadmin_write
  on public.admin_page_access for all
  using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and role = 'super_admin'
    )
  );


-- ─── has_page_access() ─────────────────────────────────────────────────────
--
-- Returns true when the currently-authenticated user may view `page`.
-- super_admin always returns true (no entry needed in admin_page_access).
-- Used by middleware.ts for per-route enforcement.

create or replace function public.has_page_access(page text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au
    where au.id = auth.uid()
      and (
        au.role = 'super_admin'
        or exists (
          select 1 from public.admin_page_access apa
          where apa.admin_user_id = au.id
            and apa.page_id = page
        )
      )
  );
$$;
