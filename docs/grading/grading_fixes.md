# Competency Rating Fixes

This document records the grading defects identified during the Competency
Rating System Clarification meeting and the required implementation work. Read
[grading_logic.md](grading_logic.md) before making changes; it is the source of
truth for the approved calculation and grade cutovers.

## Confirmed findings

### 1. The grade model has only five statuses

**Problem:** `StatusCode`, `STATUSES`, and `statusFromPercent()` support only
`A++`, `A+`, `A`, `A-`, and `A--`. All results below 50% collapse into `A--`.

**Impact:** The application cannot represent the separate **Very weak**,
**Extremely weak**, and **Severely weak** outcomes required by the stakeholder.
It also cannot show their distinct labels or summaries.

**Required fix:** Add the three approved low-performance statuses throughout
the type system and replace the old classifier with the cutovers in
`grading_logic.md`.

### 2. Precision is discarded before grading and averaging

**Problem:** The scoring engine rounds a domain percentage to an integer before
it assigns a grade and before it calculates the six-domain average.

**Impact:** A partial-box result such as 53.33% becomes 53%. This can alter a
borderline classification and makes the reported overall average less accurate.

**Required fix:** Preserve the unrounded numeric value in the scoring result;
classify and average using that value. Round only in report/card display code.

### 3. CMS provides only five domain-note variants

**Problem:** `domainNote()` and the CMS seed data provide notes only for the
five old grades, while the admin content editor recognizes only those IDs.

**Impact:** New low-performance grades would either render no summary or reuse
an incorrect generic severe note.

**Required fix:** Add one CMS block per new tier and canonical domain (18 new
blocks total), update `domainNote()`, seed data, admin headings, and add a new
append-only Supabase migration. The wording must clearly distinguish very weak,
extremely weak, and severely weak developmental gaps.

### 4. Narratives and follow-up logic assume one severe grade

**Problem:** The headline, detailed summary, next steps, status colour/tone,
report-card labels, and admin follow-up count handle only `A--` as a severe
outcome.

**Impact:** The expanded grade scale would be incomplete or misleading outside
the printed domain card.

**Required fix:** Review every `StatusCode` switch and record keyed by status.
Use tier-appropriate parent-facing language and ensure the three new low tiers
are treated as focus/follow-up areas.

### 5. Regression tests encode the obsolete scale

**Problem:** Current tests accept the former five-status model and do not cover
the stakeholder examples or precision requirements.

**Impact:** A future regression can restore the collapsed low-grade behaviour
while all existing tests still pass.

**Required fix:** Add focused scoring tests before modifying the engine:

- 120%, 100%, 80%, 60%, 40%, and 20% boundary ownership.
- A 53.33% partial-box score classified as Very weak.
- A 78% score classified as A- with a mild-gap note.
- A two-box/60% score classified as Very weak with its own note.
- A 20% score classified as Severely weak with its own note.
- Overall percentage calculated from six unrounded domain scores.
- CMS resolution for every domain and every grade/tier.

## What is already correct

The core percentage calculation already compares actual chart-box progress with
the child's exact corrected-age position and awards/subtracts 20 points per
box. The chart component already places the dotted line proportionally in the
child's current stage. Do not replace this geometry with broad percentage
bands or a nearest-stage calculation.

The current overall engine already averages the six competence values. Its
output becomes correct once it uses unrounded domain values and the expanded
classification model.

## Files expected to change

| Area | Files / work |
| --- | --- |
| Types | `lib/types.ts` — expand the status union and documentation. |
| Scoring | `lib/scoring.ts` — classification, precision retention, severities, and direct average. |
| Narratives | `lib/narrative.ts` — headline, domain notes, summary, and next steps for all tiers. |
| CMS | Add seed entries and migration `0031_*`; do not edit existing migrations. |
| Admin CMS | `app/admin/(protected)/content/page.tsx` — headings for the new CMS IDs. |
| Report/UI | `components/ReportDocument.tsx`, `components/report/ReportCardViewer.tsx`, and UI primitives — labels, colours, and any status maps. |
| Admin analytics | `lib/admin/data.ts` and any other severity filters — include every below-expectation tier. |
| Tests | `tests/scoring.test.ts` plus targeted narrative/CMS tests as appropriate. |
| Project instructions | Update `AGENTS.md` scoring thresholds and the bug tracker after validation. |

## Implementation constraints

- Do not change clinical stage data in `content/stages.ts`.
- Do not duplicate scoring logic in UI components.
- Continue using `summariseAge()`, `stageForAge()`, and `stageProgressForAge()`.
- Keep CMS priming in `ReportDocument`.
- Add, never edit, migrations; validate a new migration locally before push.
- Existing stored PDF reports are immutable. This change governs newly rendered
  reports; replacing stored reports requires explicit authorization.

## Validation checklist

1. Run the new failing regression tests before the scoring change.
2. Implement the scoring and status propagation changes.
3. Confirm every grade resolves to the correct domain note with a primed CMS
   bank and with default fallback text.
4. Confirm displayed percentages are rounded while the calculation and overall
   average retain decimals.
5. Run `npm test` and `npm run build`.
6. Apply and validate the new migration locally before deploying it.
