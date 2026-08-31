const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375;

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Completed whole months between two dates. Used to pick the age band. */
export function completedMonths(dobISO: string, onISO: string): number {
  const a = parse(dobISO);
  const b = parse(onISO);
  let months =
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * Fractional age in months. Used as the denominator of the developmental
 * quotient, so that a child a few days either side of a birthday doesn't
 * jump a whole point.
 */
export function exactMonths(dobISO: string, onISO: string): number {
  const days = (parse(onISO).getTime() - parse(dobISO).getTime()) / MS_PER_DAY;
  return Math.max(0, days / DAYS_PER_MONTH);
}

/**
 * Age corrected for prematurity.
 *
 * A baby born at 32 weeks is developmentally about two months younger than
 * their birth certificate says. Standard practice is to correct up to 24
 * months chronological age, after which the difference stops mattering.
 * Skipping this step misclassifies a large number of healthy preterm children.
 */
export function correctionMonths(
  gestationalWeeks: number | undefined,
  chronologicalMonths: number,
): number {
  if (!gestationalWeeks || gestationalWeeks >= 37) return 0;
  if (chronologicalMonths >= 24) return 0;
  const weeksEarly = 40 - gestationalWeeks;
  return Math.min(weeksEarly / 4.345, chronologicalMonths);
}

export interface AgeSummary {
  chronologicalMonths: number;
  chronologicalExact: number;
  assessedMonths: number;
  assessedExact: number;
  corrected: boolean;
  correctionMonths: number;
}

export function summariseAge(
  dobISO: string,
  onISO: string,
  gestationalWeeks?: number,
): AgeSummary {
  const chronologicalMonths = completedMonths(dobISO, onISO);
  const chronologicalExact = exactMonths(dobISO, onISO);
  const corr = correctionMonths(gestationalWeeks, chronologicalMonths);
  return {
    chronologicalMonths,
    chronologicalExact,
    assessedMonths: Math.max(0, Math.round(chronologicalMonths - corr)),
    assessedExact: Math.max(0, chronologicalExact - corr),
    corrected: corr > 0,
    correctionMonths: corr,
  };
}

/** "2 years, 3 months" — for report headers. */
export function formatAge(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m === 1 ? "" : "s"}`;
  if (m === 0) return `${y} year${y === 1 ? "" : "s"}`;
  return `${y} year${y === 1 ? "" : "s"}, ${m} month${m === 1 ? "" : "s"}`;
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
