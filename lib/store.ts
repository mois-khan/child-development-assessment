export * from "./data/children";
export * from "./data/assessments";

// Payment mock unlocks (we can keep these synchronous in localStorage or remove them if Razorpay handles it, but let's keep them synchronous to avoid breaking the build immediately)
const UNLOCK_KEY = "kaushalya.unlocks.v1";

function readUnlocks(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(UNLOCK_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function isUnlocked(childId: string, assessmentSlug: string): boolean {
  return !!readUnlocks()[`${childId}:${assessmentSlug}`];
}

export function markUnlocked(childId: string, assessmentSlug: string): void {
  const table = readUnlocks();
  table[`${childId}:${assessmentSlug}`] = true;
  try {
    window.localStorage.setItem(UNLOCK_KEY, JSON.stringify(table));
  } catch {
    // Private browsing, or storage full.
  }
}
