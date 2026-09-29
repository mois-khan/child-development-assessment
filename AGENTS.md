# AGENTS.md — KGKP Platform: Agent Working Instructions
> Read this file **completely** before making any change to this codebase.
> This applies whether you are Claude Code, Antigravity, Cursor, Copilot, or any AI agent.

---

## 1. WHAT THIS PROJECT IS

**Kaushalya Genius Kid Program (KGKP)** — a child developmental screening platform.

Parents/schools assess children aged 0–6 across **6 competences** (Visual, Auditory, Tactile, Mobility, Language, Manual) over **9 brain stages** (Phase I through VII-B). The system scores them, generates an **A4 PDF report** (the ECCTRACTION Plan), and recommends next-phase courses.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + RLS + Storage)

---

## 2. ARCHITECTURE — READ BEFORE TOUCHING ANYTHING

### 2.1 The Three Sacred Layers

```
content/          ← STATIC clinical data (stages.ts, domains.ts, items.ts)
                     These are the source of truth for the 9-stage × 6-competence chart.
                     DO NOT change numbers here without clinical approval.

lib/              ← Business logic (scoring.ts, stage.ts, age.ts, cms.ts, narrative.ts)
                     All scoring, grading, CMS text resolution happens here.

app/ + components/ ← UI only. Must never contain business logic.
                     Business logic belongs in lib/, not in page components.
```

### 2.2 Data Flow for a Report

```
Child DOB + Assessment Date
        ↓
lib/age.ts::summariseAge()         → assessedMonths (corrected for prematurity)
        ↓
lib/stage.ts::stageForAge()        → startStage (the expected phase for this age)
        ↓
Assessment walk (app/assessment/[id]/page.tsx)
  - Asks questions stage by stage (up/down ladder)
  - Saves responses to Supabase `responses` table
  - Saves stages asked to `assessments.stages_by_domain`
  - On complete: sets status='complete', completed_at=now()
        ↓
lib/scoring.ts::scoreAssessment()  → AssessmentResult (grades A++ to A--)
        ↓
lib/narrative.ts::domainNote()     → reads lib/cms.ts::getCmsText() for per-domain summaries
                                   ← cms_blocks table in Supabase (admin-editable)
        ↓
components/ReportDocument.tsx      → renders the 5-page A4 PDF
```

### 2.3 The Scoring Model (DO NOT CHANGE without client approval)

- **Base phase** = determined by `stageForAge(assessedMonths)` — the child's expected phase
- **Base score** = 0–100% based on YES answers in their expected phase (100/numItems per YES)
- **Upward bonus** = +10% per YES in each phase ABOVE the expected phase
- **Downward penalty** = -10% per NO in each phase BELOW the expected phase
- **Grade thresholds**: A++ > 120%, A+ = 101–120%, A = 80–100%, A- = 50–79%, A-- < 50%
- **Overall grade** = median of 6 domain grades, raised if any domain is A--

### 2.4 Stage-for-Age Rule (CLIENT-SPECIFIED — DO NOT CHANGE)

The client rule: *"If the child's age in months is less than even 1 month of the starting month of any phase, they should be assessed on the lower phase."*

This means **strict bracket assignment**, NOT nearest-average:
```
Phase I:    0 ≤ age < 1 months     (averageMonths = 1)
Phase II:   1 ≤ age < 2.5 months   (averageMonths = 2.5)
Phase III:  2.5 ≤ age < 7 months   (averageMonths = 7)
Phase IV:   7 ≤ age < 12 months    (averageMonths = 12)
Phase V:    12 ≤ age < 18 months   (averageMonths = 18)
Phase VI-A: 18 ≤ age < 27 months   (averageMonths = 27)
Phase VI-B: 27 ≤ age < 36 months   (averageMonths = 36)
Phase VII-A:36 ≤ age < 54 months   (averageMonths = 54)
Phase VII-B:54 ≤ age ≤ 72 months   (averageMonths = 72)
```
Implementation: `stageForAge()` in `lib/stage.ts` uses `assessedMonths >= stage.averageMonths`
iterating from highest to lowest. This correctly returns the highest phase whose averageMonths
the child has reached or exceeded. **This is correct and should NOT be changed.**

### 2.5 CMS System (CRITICAL — Must Prime Before Use)

All report text (domain summaries, recommendations, disclaimer) lives in Supabase `cms_blocks` table.
Admin edits at `/admin/content`. Format: `domain_note_{domain}_{grade}` e.g. `domain_note_vision_a_plus`.

**RULE:** Every page that reads CMS text MUST call `primeCmsBank()` from `lib/cms.ts` before rendering.
The CMS cache is a module-level singleton. Without priming, `getCmsText()` returns only hardcoded defaults.

**Variables in CMS text:** `{name}` = child's name, `{domain}` = competence name.

### 2.6 Report Immutability (Future Storage — Architecture Decision)

Reports will be stored as immutable HTML/PDF snapshots in Supabase Storage or Cloudflare R2.
- Once a report is generated and stored, it MUST NOT change even if code/logic changes.
- New reports use the latest design/logic; old reports serve from storage.
- The `assessments` table has a `share_token` column for public share links.
- Do NOT implement report re-generation without explicit instruction.

---

## 3. THE DATABASE SCHEMA (Key Tables)

```sql
children (id, profile_id, name, dob, gender, gestational_weeks, parent_name, parent_phone, parent_email, photo_url)
assessments (id, child_id, assessed_on, start_stage, stages_by_domain jsonb, details jsonb, status, completed_at, share_token)
responses (assessment_id, item_id, value 0|1)
cms_blocks (id text PK, content, description, updated_at)
course_recommendations (id, stage_id, title, subtitle, age_label, thumbnail_url, redirect_url, is_active, sort_order)
milestone_videos (id, stage_id, domain, title, description, redirect_url, thumbnail_url, is_active, sort_order)
```

**RLS Notes:**
- `assessments` UPDATE policy: user must own the child AND assessment must be `in_progress`.
  Migration `0022` fixed a bug where `status='in_progress'` check in `USING` prevented completing.
  The USING clause should NOT restrict to `in_progress` — only the WITH CHECK should.
- `cms_blocks`: Anyone can SELECT (public); only admins can INSERT/UPDATE.
- `children` table has `parent_name`, `parent_phone`, `parent_email` columns added in migration `0004`.

---

## 4. KNOWN BUGS & THEIR FIXES (Track status here)

| ID | Bug | File | Fix Status |
|----|-----|------|------------|
| B1 | Resume shows on completed assessments (RLS blocks UPDATE) | `supabase/migrations/0023_fix_completion_rls.sql` | ✅ Fixed — policy now allows owner + admin to update without status restriction |
| B2 | Red age line wrong phase on spectrum chart | `components/ReportDocument.tsx` | ✅ Fixed — uses `stageForAge()` with correct reversed-grid formula |
| B3 | CMS summaries never load in report | `components/ReportDocument.tsx`, `lib/cms.ts` | ✅ Fixed — `primeCmsBank()` now called with `cmsLoaded` state gate |
| B3b | CMS block IDs in DB were wrong (generic, not domain-specific) | `seed_cms.js`, `supabase/migrations/0024_seed_cms_blocks.sql` | ✅ Fixed — all 31 correct IDs seeded; run migration 0024 or `node seed_cms.js` |
| B4 | parentName not fetched from DB join | `lib/data/assessments.ts` | ✅ Fixed — all 3 mapping locations updated |
| B5 | Cell shading hardcoded at 50% instead of proportional | `components/ReportDocument.tsx` | ✅ Fixed — uses `score.percent * 100` clamped to 0-99 |
| B6 | MilestoneVideoRow never rendered in report | `components/ReportDocument.tsx` | ✅ Fixed — added after Recommendation paragraph per competence |
| B7 | Duplicate buttons in CourseRow | `components/report/CourseRow.tsx` | ✅ Fixed — removed second button, added null fallback |

### ⚠️ Action Required After These Fixes
1. **Apply migration 0023**: `npx supabase db push` — fixes the RLS policy
2. **Apply migration 0024**: `npx supabase db push` — seeds all correct CMS block IDs
3. **OR run**: `SUPABASE_SERVICE_ROLE_KEY=<key> node seed_cms.js` to seed CMS blocks directly
4. After seeding, edit block content in admin at `/admin/content`

---

## 5. RULES EVERY AGENT MUST FOLLOW

### 5.1 Security Rules
- **NEVER** write Supabase service-role key or any secret into any `.ts`/`.tsx`/`.js` file.
- All secrets live ONLY in `.env.local` (gitignored). Use `lib/supabase/env.ts` to access env vars.
- **NEVER** disable RLS on any table.
- **NEVER** add `for select using (true)` to a table containing PII (children, profiles, assessments, responses).
- **NEVER** bypass the `is_admin()` check for admin routes. All `/admin/*` routes must go through `app/admin/(protected)/layout.tsx`.
- Validate all user inputs server-side. The assessment page saves responses directly to Supabase — item IDs should match known item IDs from the bank.

### 5.2 Consistency Rules
- **NEVER** duplicate business logic between `lib/` and UI components. If you catch yourself computing a score or grade in a `.tsx` file, move it to `lib/`.
- **NEVER** hardcode report text in `.tsx` files. All editable text goes through `getCmsText()` with a sensible default fallback.
- **NEVER** change the scoring thresholds (A++/A+/A/A-/A--) without updating `lib/scoring.ts` AND the CMS block descriptions AND the `AGENTS.md` scoring model section.
- **ALWAYS** use `stageForAge()` from `lib/stage.ts` — never implement stage-for-age inline in a component.
- **ALWAYS** use `summariseAge()` from `lib/age.ts` for age calculations — never compute months inline.
- Domain codes (`vision`, `auditory`, `tactile`, `mobility`, `language`, `hand`) are the canonical keys everywhere — in DB, in CMS block IDs, in scoring, in the report. Never introduce aliases.

### 5.3 Report Rules
- The report is **5 pages** of A4 (210mm × 297mm, `height: 297mm`). Never collapse to fewer pages without design approval.
- Page 1: Cover + Profile · Page 2: Spectrum Chart · Pages 3-4: Per-Competence (2 per page) · Page 5: Conclusion
- The **red dashed age line** must use `stageForAge(age.assessedMonths)` to find which row to draw on.
- The **spectrum chart shading** must be proportional to `score.percent` for the partial (current) phase — NOT hardcoded to 50%.
- The **mini-chart** on pages 3-4 must show Phase, Brain Stage name, and Time Frame columns.
- `MilestoneVideoRow` must appear in each per-competence section (pages 3-4).
- `CourseRow` appears only on page 5 (final recommendation).

### 5.4 CMS Rules
- All domain notes are keyed as: `domain_note_{domainCode}_{grade}` where grade is `a_plus_plus`, `a_plus`, `a`, `a_minus`, `a_minus_minus`.
- The disclaimer is keyed as: `report_disclaimer`.
- The overall headline is generated by `lib/narrative.ts::headline()` — NOT from CMS (it's too dynamic).
- **Before adding a new CMS key**, add the seed row to `scripts/seed_cms.js` AND to a new migration.
- CMS variables: `{name}` and `{domain}` are always available. Add others only if you update `getCmsText()`.

### 5.5 Migration Rules
- **NEVER** edit existing migrations. Always add a new migration file with the next sequence number.
- Migration files live in `supabase/migrations/`. Format: `NNNN_description.sql`.
- After adding a migration, update this file's "Database Schema" section if the schema changed.
- Always test migrations against the local Supabase instance before pushing.

---

## 6. FILE MAP (Where Things Live)

```
lib/stage.ts              → stageForAge() — stage from child age
lib/age.ts                → summariseAge() — age calculation with prematurity correction
lib/scoring.ts            → scoreAssessment() — the full A++ to A-- scoring engine
lib/narrative.ts          → headline(), domainNote(), DISCLAIMER — reads CMS via getCmsText()
lib/cms.ts                → primeCmsBank(), getCmsText() — CMS cache singleton
lib/naming.ts             → reportName(), phaseLabel() — display strings
lib/item-bank.ts          → liveItemsFor(), primeItemBank() — live question bank with DB overrides
lib/store.ts              → re-exports lib/data/assessments.ts and lib/data/children.ts
lib/data/assessments.ts   → getAssessment(), createAssessment(), completeAssessment(), etc.
lib/data/children.ts      → getChild(), createChild(), listChildren(), etc.
lib/data/course-recommendations.ts → getCourseRecommendations(), admin CRUD
lib/data/milestone-videos.ts       → getMilestoneVideos(), admin CRUD

content/stages.ts         → BRAIN_STAGES (9 stages, their averageMonths, superiorMonths, slowMonths)
content/domains.ts        → DOMAINS (6 competences), INPUT_DOMAINS, OUTPUT_DOMAINS
content/items.ts          → shipped item bank (overrideable via DB)

components/ReportDocument.tsx      → The full 5-page A4 report renderer
components/report/CourseRow.tsx    → Course recommendation card (page 5 only)
components/report/MilestoneVideoRow.tsx → Video recommendation with QR (pages 3-4)

app/assessment/[id]/page.tsx       → The question walk (intro → questions → finish)
app/children/[id]/page.tsx         → Child profile + assessment history
app/children/page.tsx              → Family roster
app/report/[id]/page.tsx           → Report viewer (wraps ReportDocument)
app/admin/(protected)/content/page.tsx   → CMS editor for domain notes
app/admin/(protected)/courses/page.tsx   → Course recommendation CMS
app/admin/(protected)/milestone-videos/page.tsx → Video recommendation CMS

supabase/migrations/      → ALL schema changes (append only, never edit)
```

---

## 7. ENVIRONMENT VARIABLES

```bash
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Server-only, never expose to client
RAZORPAY_KEY_ID=                # Payment gateway
RAZORPAY_KEY_SECRET=            # Server-only
```

---

## 8. RUNNING THE PROJECT

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build (must pass before any PR)
npm run test         # Run tests in tests/
npx supabase db push # Apply pending migrations to linked Supabase project
npx supabase start   # Start local Supabase (Docker required)
```

---

## 9. CURRENT SPRINT — ACTIVE WORK

**Goal:** Fix all 7 bugs (B1-B7), wire up CMS end-to-end, make reports immutable-ready.

**Do NOT:**
- Change the scoring algorithm without explicit user instruction
- Add new pages/routes without explicit user instruction
- Change BRAIN_STAGES data without clinical approval
- Remove the `primeCmsBank()` call from ReportDocument — it must stay

**DO:**
- Always run `npm run build` and verify it passes after changes
- Keep AGENTS.md updated as bugs are fixed (update the Fix Status column above)
