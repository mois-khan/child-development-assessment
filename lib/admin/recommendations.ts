"use client";

/**
 * Recommendation rules — maps a domain+status condition to a course. Drives
 * the report's "Recommended next" section once wired up (still a static
 * block on the report page today — see the note on that page).
 *
 * A rule with domain = null matches on the child's overall status instead of
 * one area; status = null matches any status for that domain. Highest
 * priority active match wins; resolveRecommendedCourse() is the one function
 * the report page will eventually call.
 */
import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AssessmentResult, DomainCode, StatusCode } from "@/lib/types";
import { adminListCourses, type AdminCourse } from "./courses";

export type { AdminCourse };

const RULES_KEY = "kaushalya.admin.recommendation-rules.v1";

export interface AdminRecommendationRule {
  id: string;
  courseId: string;
  domain: DomainCode | null;
  status: StatusCode | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export interface RuleInput {
  id?: string;
  courseId: string;
  domain: DomainCode | null;
  status: StatusCode | null;
  priority: number;
  isActive: boolean;
}

function read(): Record<string, AdminRecommendationRule> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(RULES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function write(table: Record<string, AdminRecommendationRule>): void {
  window.localStorage.setItem(RULES_KEY, JSON.stringify(table));
}

function newId(): string {
  return `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function adminListRules(): AdminRecommendationRule[] {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed recommendation rules are not wired up yet.");
  }
  return Object.values(read()).sort((a, b) => b.priority - a.priority);
}

export function adminSaveRule(input: RuleInput): AdminRecommendationRule {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed recommendation rules are not wired up yet.");
  }
  const table = read();
  const id = input.id ?? newId();
  const existing = input.id ? table[input.id] : undefined;
  const rule: AdminRecommendationRule = {
    id,
    courseId: input.courseId,
    domain: input.domain,
    status: input.status,
    priority: input.priority,
    isActive: input.isActive,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  table[id] = rule;
  write(table);
  return rule;
}

export function adminDeleteRule(id: string): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed recommendation rules are not wired up yet.");
  }
  const table = read();
  delete table[id];
  write(table);
}

function ruleMatches(rule: AdminRecommendationRule, result: AssessmentResult): boolean {
  if (rule.domain) {
    const score = result.domainScores.find((d) => d.domain === rule.domain);
    if (!score) return false;
    return rule.status ? score.status === rule.status : true;
  }
  return rule.status ? result.overallStatus === rule.status : true;
}

/**
 * The highest-priority active rule that matches this result, and its
 * course. Null when nothing matches (or the course it points to was
 * deleted/deactivated) — callers should fall back to a default recommendation.
 */
export function resolveRecommendedCourse(
  result: AssessmentResult,
): { rule: AdminRecommendationRule; course: AdminCourse } | null {
  if (isSupabaseConfigured()) return null;
  const rules = adminListRules().filter((r) => r.isActive);
  const courses = adminListCourses();
  for (const rule of rules) {
    if (!ruleMatches(rule, result)) continue;
    const course = courses.find((c) => c.id === rule.courseId && c.isActive);
    if (course) return { rule, course };
  }
  return null;
}

/** For a simple domain+status preview picker in the admin UI. */
export function previewMatch(
  domain: DomainCode | null,
  status: StatusCode,
): { rule: AdminRecommendationRule; course: AdminCourse } | null {
  if (isSupabaseConfigured()) return null;
  const fakeResult: Pick<AssessmentResult, "domainScores" | "overallStatus"> = {
    overallStatus: status,
    domainScores: domain
      ? ([{ domain, status }] as AssessmentResult["domainScores"])
      : [],
  };
  const rules = adminListRules().filter((r) => r.isActive);
  const courses = adminListCourses();
  for (const rule of rules) {
    if (!ruleMatches(rule, fakeResult as AssessmentResult)) continue;
    const course = courses.find((c) => c.id === rule.courseId && c.isActive);
    if (course) return { rule, course };
  }
  return null;
}

export function useAdminRules(): { rules: AdminRecommendationRule[]; refresh: () => void } {
  const [rules, setRules] = useState<AdminRecommendationRule[]>([]);

  const refresh = useCallback(() => {
    if (isSupabaseConfigured()) return;
    setRules(adminListRules());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rules, refresh };
}
