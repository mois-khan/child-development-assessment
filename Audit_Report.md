# Kaushalya Genius Kid Program
## Security and Logic Audit Report
**Date:** October 1, 2026
**Prepared by:** Antigravity (Advanced Agentic Coding)

---

### Executive Summary

A comprehensive audit of the platform's core scoring engine, database schema, and Row Level Security (RLS) policies has uncovered several critical vulnerabilities and logic flaws. While recent migrations have addressed significant security holes (like the signup privilege escalation), a subsequent patch accidentally reopened a data immutability vulnerability. Additionally, the scoring engine's implementation has drifted significantly from its documented design, leading to mathematically incorrect metrics being generated.

This report outlines four major issues across Business Logic and Security, complete with reproduction scenarios and recommended fixes.

---

### Part 1: Business Logic & Scoring Flaws

#### 1. Neurological Age (DQ) Calculation is Mathematically Broken
**Location:** `lib/scoring.ts`

**The Flaw:**
The system is calculating a percentage score (e.g., 80%, 110%) based on a base score plus upward bonuses and downward penalties. However, instead of using this to calculate the developmental quotient (DQ) properly, it assigns this raw percentage directly to the `neurologicalMonths` property.

```typescript
// Current implementation in lib/scoring.ts
let finalPercent = baseScore + upBonus - downPenalty;
// ...
return {
  percent: finalPercent / 100,
  neurologicalMonths: finalPercent, // <--- CRITICAL BUG
  dq: finalPercent,
  status,
  // ...
};
```

**Scenario:**
- A child has a chronological age of 12 months (Stage IV).
- They answer all Stage IV questions perfectly (100%) and get two extra YES answers in Stage V (+20%).
- `finalPercent` is calculated as 120.
- The system reports their `neurologicalMonths` as **120 months (10 years old)** instead of calculating the interpolated age (which should be ~14 months based on the chart's timeframes). 
- Because DQ is supposed to be `(Neurological Age / Chronological Age) * 100`, assigning `120` to DQ directly happens to look like a valid percentage, but assigning it to `neurologicalMonths` destroys any ability to do actual age-based reporting.

**Recommendation:**
Restore the `neurologicalAge()` interpolation function (which still exists in `lib/scoring.ts` but is unused by the main `scoreAssessment` loop) to calculate the actual neurological age in months based on the `averageMonths` of the stages, and calculate DQ properly as `(Neurological Age / Chronological Age) * 100`.

#### 2. Downward Penalty Escalation
**Location:** `lib/scoring.ts`

**The Flaw:**
The downward penalty strictly deducts 10% per NO answer in any stage below the starting stage.

**Scenario:**
- A child misses a question in their starting stage (Stage V). The ladder descends.
- Stage IV has 6 questions. The child gets 3 YES and 3 NO.
- Stage III has 4 questions. The child gets 1 YES and 3 NO.
- The penalty accumulates as `(-10% * 3) + (-10% * 3) = -60%`.
- Combined with a partial base score, a child can rapidly hit 0% just because a lower stage happened to have a high number of questions.

**Recommendation:**
The penalty should be proportional to the stage being tested (e.g., deducting a fraction of the stage's value) rather than a flat 10% per question, which heavily penalizes children who fall into stages that happen to have larger question banks.

---

### Part 2: Security & RLS Vulnerabilities

#### 3. Report Immutability Violated (Completed Assessments can be tampered with)
**Location:** `supabase/migrations/0023_fix_completion_rls.sql`

**The Flaw:**
Migration `0009` correctly locked completed assessments so they could not be altered once finished:
`for update using (status = 'in_progress' ...)`

However, Migration `0023` (intended to fix an issue where admins couldn't complete assessments) removed the `status = 'in_progress'` check entirely:
```sql
create policy assessments_update on assessments
  for update
  using (
    exists (
      select 1 from public.children c
      where c.id = assessments.child_id
        and (c.profile_id = auth.uid() or public.is_admin())
    )
  )
```

**Scenario:**
- A parent completes an assessment. A PDF report is generated and the status is `complete`.
- A malicious user (or an accidental client-side bug) sends an UPDATE request to Supabase for this assessment ID.
- Because the `in_progress` lock is gone, the database accepts the update. The historical assessment data is overwritten, violating the core architectural rule of "Report Immutability".

**Recommendation:**
Re-add the status lock to the `assessments_update` policy, ensuring it applies to the *existing* row state (using `USING`) while allowing the transition to complete:
`USING (status = 'in_progress' AND ...)`

#### 4. Missing Admin Access for Responses
**Location:** `supabase/migrations/0009_critical_security_fixes.sql`

**The Flaw:**
While admins were granted access to update `assessments`, the corresponding policy for `responses_update` completely forgot to include `public.is_admin()`.

```sql
create policy responses_update on responses
  for update using (
    exists (select 1 from assessments a join children c on c.id = a.child_id
             where a.id = responses.assessment_id and c.profile_id = auth.uid()
               and a.status = 'in_progress')
  );
```

**Scenario:**
- A parent calls support saying they accidentally clicked "No" on a question and are stuck.
- An admin logs in and tries to correct the response via the admin dashboard.
- The database rejects the update with a 403 Forbidden because `public.is_admin()` is missing from the `responses_update` policy.

**Recommendation:**
Update `responses_update`, `responses_write`, and `responses_delete` to include `or public.is_admin()` in the profile ID check.

---

### Conclusion
To stabilize the platform, we must:
1. Revert or patch Migration 0023 to restore the `in_progress` lock while keeping admin access.
2. Patch `responses` RLS policies to allow admin intervention.
3. Overhaul the `scoreAssessment` function to calculate Neurological Age via interpolation, rather than misusing the raw percentage score.
