# Production Build — Plan & Handover

**Branch:** `production-ready` (branched from `main` after merging `kgkp-brand-redesign`)
**Do not touch:** `kgkp-brand-redesign` — that is the client demo branch and must stay exactly as it is.
**Last updated:** 6 Sep 2026

This document is written to be self-contained. Someone picking it up cold —
including a fresh AI session with none of the conversation history — should be
able to continue from here without re-deriving anything.

---

## 1. The objective, in one line

Turn a working UI prototype into a real product: real accounts, real database,
real payments, and a sales team that can work a lead from signup to conversion
without hunting through the app.

The guiding tests:

- A new parent understands what to do without being taught.
- An admin opens a lead and immediately knows who they are, what their children
  have done, what was said last time, and when to call next.

**The one rule that shapes the whole data model: the parent is the lead. The
child is never the lead.**

---

## 2. Where things stand right now

### Done and verified

| Thing | State |
|---|---|
| Scoring engine (7 brain stages, adaptive ladder) | Solid. 40 tests passing. This is the real IP — do not rewrite it. |
| Question bank content (ACE booklet items) | Complete, in `content/items.ts` |
| Report generation + filled-in Developmental Profile chart | Working |
| Supabase project created | `kaushalya-genius-kid`, ap-south-1 |
| Core schema designed + applied | `supabase/migrations/0001_core.sql` — 8 tables, RLS on all |
| Signup trigger | **Proven by test**: inserting an auth user auto-created a profile *and* exactly one lead |
| Interaction trigger | **Proven by test**: logging a call moved lead `new → interested` and set the follow-up date |
| Cascade deletes | Verified clean |
| Admin cut to 3 sections | Dashboard, Leads, Question bank. Courses/Activities/Videos deleted (pages + libs) |
| Auth provider + middleware + join page | Written, **not yet runtime-verified** (blocked, see §3) |
| Database TypeScript types | Hand-written in `lib/supabase/database.types.ts` |

### Resolved Blocker
- **Supabase credentials have been updated and verified.** The project is linked and migrations `0001_core.sql` and `0002_recommendations.sql` have been applied.

### Recently Completed (Phase H - Recommendation & RBAC)
- Built `milestone_videos` and `course_recommendations` CMS and injected them into the assessment report.
- Built `admin_users` RBAC page with page-level access control enforced in `middleware.ts`.
- Implemented `lib/data/milestone-videos.ts`, `lib/data/course-recommendations.ts`, and `lib/data/rbac.ts` connected directly to Supabase.
- These features are fully wired to the backend and ready for use.

### Still mock / not real (To be done in upcoming phases)

- **All parent-side data is still localStorage** (`lib/store.ts`). Children,
  assessments and responses do not persist beyond one browser.
- **No parent auth is wired into the pages yet.** The provider exists; the
  pages don't use it.
- **Admin auth is a localStorage dev-session flag** (`lib/admin/auth.ts`).
- **Payment is a coupon code** that flips a boolean. No Razorpay.
- **The leads admin is localStorage and assessment-keyed** — it treats the
  assessment as the lead. This contradicts "the parent is the lead" and must
  be rebuilt against the new schema.
- **`/admin/submissions` still exists** but is out of the nav. Its content
  (assessment progress) must move inside the lead profile, then delete it.

---

## 4. The data model (already applied)

```
auth.users ──1:1── profiles (the parent)
                     ├──1:1── leads          ← the parent IS the lead
                     └──1:N── children
                                └──1:N── assessments
                                           └──1:N── responses
leads ──1:N── interactions    ← the call log; drives all follow-up state
profiles ──1:N── payments
```

### Two triggers do work the app would otherwise have to remember

**`on_auth_user_created`** — creates the profile *and* its single lead in the
same transaction as the account. The `UNIQUE` on `leads.profile_id` makes a
duplicate lead structurally impossible, not merely unlikely. This is what
satisfies "a refresh / a second login / a second child must not create another
lead" without any application-code discipline.

**`interactions_sync_lead`** — after every interaction insert, derives the
lead's `status`, `next_follow_up_at` and `last_interaction_at` from that newest
interaction. The two can therefore never drift apart the way a hand-maintained
status field eventually does.

### RLS posture

- A parent sees their own family and nothing else.
- Staff (`admin_users`, checked via `is_admin()`) see everything.
- **`leads` and `interactions` have no parent-facing policy at all** — a parent
  must never be able to read what sales wrote about them.
- `payments` are written only by the server (service role bypasses RLS).

### Why the question bank is NOT in the database

`content/items.ts` stays in version control on purpose. It is a clinical
instrument; having it reviewable in git beats having it editable by a stray
click. `responses.item_id` is therefore a TEXT key matching those ids
(`"s5-vision-01"`), not a foreign key.

Consequence: the Question Bank admin edits are still a localStorage overlay.
Moving the bank into Postgres is a legitimate later step — but it is lower
value than the lead pipeline and should not jump the queue.

---

## 5. Remaining work, in order

### Phase A — Restore the connection *(blocked on credentials)*
1. New Supabase project, apply `0001_core.sql`
2. Fill `.env.local`, turn off email confirmation
3. Verify: signup creates profile + lead; RLS blocks cross-parent reads

### Phase B — Parent auth wired into the app
- `lib/auth/provider.tsx`, `middleware.ts`, `app/join/page.tsx` are **written**
- Remaining: gate "Start Assessment" behind `/join?next=…`, show signed-in
  state in `TopBar`, add sign-out, protect `/children` and `/assessment`

### Phase C — Data layer: localStorage → Supabase
Replace `lib/store.ts` with async, Supabase-backed modules:
```
lib/data/children.ts      list / get / create / update / delete
lib/data/assessments.ts   create / get / saveResponse / saveDetail /
                          appendStage / complete / forChild
```
Every call site becomes async — roughly 8 pages. The assessment page already
keeps optimistic local state, so per-tap saves can be fire-and-forget.

**Watch out:** `scoreAssessment()` currently takes a `child` object and reads
`content/items.ts` synchronously. Keep that shape — feed it rows loaded from
the DB. Do not make the engine async.

### Phase D — Leads management (the highest-value part)
Rebuild parent-centric against the new schema:
- **List:** parent name, phone, email, #children, assessment progress, status,
  last interaction, next follow-up. Sort: overdue → due today → new → rest.
  Search by name/phone/email. Filter by status and follow-up state.
- **Profile as an operational workspace:** header with name, status, phone,
  email, created, and **next follow-up made prominent** — not a small grey line.
  Then cards: Parent details · Children · Assessment progress per child ·
  Next follow-up · Interaction history.
- **Log interaction** in seconds: date/time → channel → outcome → remarks →
  next follow-up date. Four fields, not a form.
- **History as a readable timeline**, newest first, each entry showing date,
  channel, outcome badge, remarks, and the follow-up that was set.
- Then **delete `/admin/submissions`** — its content now lives in the profile.

### Phase E — Razorpay (test mode)
- `POST /api/payments/order` — server-side order create (secret never leaves server)
- Checkout on the client via `checkout.razorpay.com/v1/checkout.js`
- `POST /api/payments/verify` — HMAC signature verification
- `POST /api/payments/webhook` — authoritative status, uses service role
- Handle success / failure / cancellation / abandonment distinctly in the UI

### Phase F — Admin auth for real
Replace the dev-session flag with Supabase auth + `admin_users` + `is_admin()`.
Staff accounts are created in the dashboard with `is_admin: true` in metadata —
the signup trigger routes them to `admin_users` instead of creating a lead.

### Phase G — UX pass
Public browsing stays open; auth only at "Start Assessment". Loading, empty and
error states everywhere. Mobile: signup, assessment, lead profile and interaction
logging must all be genuinely usable, not shrunk desktop.

---

## 6. Definition of done

- [ ] Public site browsable without an account
- [ ] "Start Assessment" prompts signup/login
- [ ] Signup requires name + mobile + email
- [ ] Parent account created correctly
- [ ] **New parent automatically becomes a lead** (trigger — already proven)
- [ ] Parent distinct from child throughout
- [ ] Parent can create/manage multiple children
- [ ] Assessment data persists to Supabase
- [ ] Assessment progress visible to admin inside the lead
- [ ] Supabase properly connected *(blocked)*
- [ ] Razorpay test payment works end to end
- [ ] Admin nav = Dashboard, Question Bank, Leads only ✅ **done**
- [ ] Leads list works
- [ ] Lead profile works
- [ ] Children appear inside the parent lead
- [ ] Assessment progress appears inside the lead profile
- [ ] Admin can log an interaction with outcome + remarks
- [ ] Admin can schedule a follow-up
- [ ] Follow-up displayed prominently
- [ ] Interaction history chronological and readable
- [ ] Lead status works
- [ ] Search/filter works
- [ ] Loading / error / empty states
- [ ] Mobile works
- [ ] No fake buttons, no mock core functionality
- [ ] No unnecessary admin sections ✅ **done**

---

## 7. Decisions taken, and why

**Triggers over application code for profile/lead creation.** App code can be
skipped by a client that forgets to call it, can half-succeed, and can run
twice. A trigger cannot.

**Deleted the two old migrations rather than amending them.** Neither was ever
applied anywhere, and both described the old 13-band engine (`age_bands`,
`items.band_id`, responses 0–2) that the 7-stage rewrite replaced. Keeping them
would have meant carrying a fiction forward.

**Removed Courses / Activities / Videos entirely.** They were content-management
surfaces competing with the two things the panel exists for. The report keeps
its "try at home" activities by reading `content/activities.ts` directly, and
lost the suggested-video column, which never rendered anything but
"Video coming soon" — exactly the kind of fake surface the brief rules out.

**Money in paise (`amount_paise`), never floats.**

**Question bank stays in git** — see §4.

---

## 8. Resuming quickly

```bash
git checkout production-ready
npm install
# put credentials in .env.local (see §3)
npm run dev
npm test        # 40 tests, all should pass
npx tsc --noEmit
```

Read in this order: this file → `supabase/migrations/0001_core.sql` →
`lib/scoring.ts` (the engine, don't break it) → `lib/auth/provider.tsx`.
