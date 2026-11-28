# Competency Rating Logic

This document is the source of truth for competency percentages, grades, and
developmental summaries in the KGKP report. It records the stakeholder
agreement from the Competency Rating System Clarification meeting.

## Core rule

Each competence is measured relative to the child's exact corrected-age
position on the report chart's dotted age line.

- The dotted age line is the expected performance for the child's age.
- Performance exactly at that line is **100%**.
- Each complete chart box represents **20 percentage points**.
- Progress above the age line adds 20 points per completed box.
- Gaps below the age line subtract 20 points per missing box.
- A partially completed or missing box contributes its proportional share of
  20 points.
- The exact corrected age determines the dotted-line position. Use
  `summariseAge()` and `stageProgressForAge()`; do not calculate age or line
  position in a UI component.

The calculation is:

```text
competencyPercent = 100
  + sum((actualBoxProgress - expectedBoxProgress) * 20)
```

`actualBoxProgress` and `expectedBoxProgress` are values from 0 to 1. The
result must be clamped to a minimum of 0, but must retain fractional precision
for calculation and averaging. Round only for display.

## Partial-box example

If a competence is two complete boxes and one-third of another box below the
age line:

```text
gap = 2 * 20 + (1 / 3) * 20 = 46.67
score = 100 - 46.67 = 53.33%
```

The grade is **Very weak**.

## Approved grade cutovers

Boundary values belong to the weaker tier. This preserves the intended meaning
of each 20-point box below the age line.

| Percentage | Grade / developmental summary tier | Position relative to age line |
| --- | --- | --- |
| `> 120%` | A++ — Highly advanced | More than one box above |
| `> 100%` to `120%` | A+ — Advanced | Up to one box above |
| `> 80%` to `100%` | A — Age appropriate | At the line or less than one box below |
| `> 60%` to `80%` | A- — Mild developmental gap | One complete box below |
| `> 40%` to `60%` | Very weak | Two complete boxes below |
| `> 20%` to `40%` | Extremely weak | Three complete boxes below |
| `0%` to `20%` | Severely weak | Four or more boxes below |

Examples:

- `78%` is **A-** (mild developmental gap).
- `60%` is **Very weak**.
- `53.33%` is **Very weak**.
- `40%` is **Extremely weak**.
- `20%` is **Severely weak**.

## Geometry is authoritative

Use the calculated geometric gap and exact percentage, not approximate spoken
box counts or labels from older reports. For example, a 2.5-box gap equals
50%, while a score of 33% represents approximately 3.35 boxes below the age
line. These are not equivalent.

## Overall result

The overall percentage is the arithmetic average of the six unrounded
competency percentages:

```text
overallPercent = (C1 + C2 + C3 + C4 + C5 + C6) / 6
```

Classify the overall percentage using the same cutovers above. Round the final
percentage only when displaying it in the report.

## Narrative and CMS requirements

Every grade/tier must resolve to its own domain narrative. CMS text must be
available for all six canonical domain codes:

```text
vision, auditory, tactile, mobility, language, hand
```

The domain-note identifiers must follow this pattern:

```text
domain_note_{domain}_{grade}
```

The exact suffixes for the new tiers must be kept consistent in the type
system, scoring engine, narrative resolver, seed script, and migration. Do not
silently reuse an A-- narrative for very weak, extremely weak, or severely weak
results.

## Change control

Do not change these cutovers, the 20-point box value, or age-line scoring
without explicit stakeholder approval. Update this document and the regression
tests in the same change as any approved modification.
