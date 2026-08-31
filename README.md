# Kaushalya Kids Genius — Development Screener

A proof of concept for a parent-led developmental screening tool for children
aged 0–6. A parent enters their child's details, answers around seventy short
questions, and gets a report showing how each of six areas is developing, plus
activities to do at home.

Built to demonstrate **design, flow and experience**. The milestone content is
real and sourced from public-domain instruments, but it is a working
placeholder — see [Content and licensing](#content-and-licensing).

## Running it

```bash
npm install
npm run dev
```

No credentials, no database setup. Assessments persist to `localStorage`.

```bash
npm test          # 33 tests over the scoring engine and item bank
npm run build     # production build
```

To look at a finished report without answering seventy questions:

```bash
npx tsx scripts/seed-demo.ts
```

Paste the JSON it prints into `localStorage` under the key
`kaushalya.assessments.v1`, then open `/report/demo`.

## How the screening works

Three decisions carry the whole thing.

### It tests three age bands, not one

Asking a 26-month-old only the 25–30 month questions tells you *that* something
is wrong without telling you *where the child actually is* — which is the one
thing a parent needs in order to act. So each domain is assessed across a
window: the band below the child's age, the band at it, and the band above.

There are thirteen bands across 0–72 months, narrow in infancy where
development moves fastest. Each band's upper bound is a CDC checkpoint age, so
every item traces to a validated anchor.

### It runs the basal rule to completion

If the child does not master the lowest band they were asked, we do not know
where they are — the estimate is pinned to wherever we happened to start. So
the assessment reaches down a band at a time until they master one, and up one
band if they top out.

This matters more than it sounds. An earlier version only reached down on a
near-zero score, which left a cliff: a child at 74% of the 19–24 month band
scored a developmental age of 14 months, while one at 75% scored 24. Ten months
on a one percent difference. `tests/scoring.test.ts` pins this.

### It scores on a ratio, not a month gap

"Three months behind" is serious at nine months old and noise at five years.
Each domain produces a developmental age, and the status comes from the ratio:

```
DQ = (developmental age in months ÷ age in months) × 100
```

| DQ | Status | What it means |
| --- | --- | --- |
| 90+ | On track | At or ahead of expectation |
| 75–89 | Emerging | A little behind; targeted play, recheck in 3 months |
| 60–74 | Needs focus | Meaningfully behind; daily activity, mention to the doctor |
| < 60 | Worth a closer look | Suggest a developmental paediatrician |

Two corrections the maths needs:

- **Preterm babies** are scored against corrected age up to 24 months. A baby
  born at 32 weeks is developmentally two months younger than their birth
  certificate says; skipping this misclassifies a lot of healthy children.
- **Under four months**, the ratio has a denominator small enough that one
  question swings it from 100 to 50, so the DQ is suppressed entirely and the
  report shows plain achievement instead.

One more rule worth knowing: a single weak domain is never averaged away. Five
strong domains and one at 55 average to a comfortable 88, and that child needs
attention — so the overall status is pulled down, and the report says which
domain did it rather than showing a healthy number beside a cautious label.

## Layout

```
app/                 landing → intake → assessment → report
components/          UI pieces and the hand-rolled SVG charts
content/             domains, age bands, 300 items, 108 activities  ← the data
lib/scoring.ts       the engine: pure, no I/O, fully tested
lib/narrative.ts     every sentence a parent can receive
lib/store.ts         persistence — the only file Supabase changes
supabase/migrations/ the schema this is shaped around
tests/               33 tests, incl. hand-worked example children
```

`lib/scoring.ts` is a pure function with no I/O, so it can be validated against
hand-worked children before any family sees it. The example cases are typical,
advanced, one weak domain, globally behind, preterm, and under four months.

Report wording is **template-driven, never model-generated at runtime**. This
report tells some parents something frightening about their child, and every
sentence they can receive should be reviewable in advance.

## Content and licensing

| Source | Items | Status |
| --- | --- | --- |
| CDC *Learn the Signs. Act Early.* (2021) | 157 | US federal government, public domain |
| NIDCD/NIH hearing & communication checklist | 41 | US federal government, public domain |
| WHO motor milestone windows (2006) | 3 | Freely reproducible with attribution |
| Authored for this project | 99 | Vision strand, the 61–72 month band, gaps |

**ASQ-3 and Denver II are commercial licensed instruments. Their items are not
used here and must not be pasted in.** The [Trivandrum Development Screening
Chart (TDSC 0–6)](https://link.springer.com/article/10.1007/s12098-013-1144-2)
is the closest validated Indian equivalent — 51 items, validated against Denver,
84.6% sensitivity and 90.8% specificity — and is worth licensing if Kaushalya
wants an India-normed instrument. The bank is structured so its items could
replace these directly.

### What is placeholder and needs Kaushalya's input

- **The six domains.** These cover the four named in the brief (auditory,
  mobility, reactive, language and communication) plus vision and hand skills.
  If "reactive" means something specific in the Kaushalya framework, the item
  bank changes.
- **The 61–72 month band.** Past where the CDC checklists stop, authored from
  standard school readiness expectations. Needs review before use.
- **The scoring thresholds.** The 75% mastery cut and the 90/75/60 boundaries
  are defensible defaults from standard screening practice, but they are
  clinical judgements and should be confirmed by your child development lead.
- **All 108 activities.** Authored here as household-only, low-cost play.
  Replace with Kaushalya's own programme activities.

None of the above requires a code change. It is all data in `content/`.

## Moving to Supabase

`supabase/migrations/0001_init.sql` is the schema this is already shaped
around. The migration is:

1. Run the migration and seed `content/` into the content tables.
2. Replace the six functions in `lib/store.ts` with Supabase queries.
3. Move `scoreAssessment` to a server action and persist `domain_scores` and
   `results`, so reports are immutable snapshots.

Two things are built in from the start because retrofitting them is painful:
item text is stored as `{ en, hi, kn }` JSON, and every assessment records the
item bank version that produced it, so an old report still renders after the
questions are rewritten.

Until then, reports live in one browser — a report link will not open on
another device. That needs the database.

## Known gaps

- **No real share links or PDF file.** "Save as PDF" uses the browser's print
  dialogue against a print stylesheet. A proper server-rendered PDF and a
  shareable URL both need the database.
- **`item_activities` is unused.** Activities are currently selected per domain
  at the child's *developmental* stage, which is already better than generic age
  advice — a four-year-old with 30-month language gets 30-month language play.
  Per-item mapping is the next refinement.
- **No accounts or history.** Progress between two reports tells a parent far
  more than any single report, and that is the most valuable thing to add next.
- **English only**, though the schema is ready for more.

---

**This is a screening tool, not a diagnostic one.** It is based on parent
report and cannot diagnose any condition. Nothing in it should be presented to
families as a diagnosis.
