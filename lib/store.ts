"use client";

import { BANK_VERSION } from "@/content/items";
import type { Assessment, Child, DomainCode, ResponseValue } from "./types";

/**
 * Assessment storage.
 *
 * The POC persists to localStorage so the app runs with no credentials and can
 * be demoed from a laptop. Every call goes through this module, and the shape
 * mirrors the Supabase tables in supabase/migrations/0001_init.sql — swapping
 * the body of these six functions for Supabase queries is the whole migration.
 *
 * Note the consequence while this is localStorage: a report link only opens on
 * the device that produced it. Real share links need the database.
 */

/**
 * v2 — the brain-stage engine.
 *
 * v1 records were scored against the thirteen-band item bank, whose stage ids
 * and item ids no longer exist. They cannot be re-scored, so they are left
 * under their old key rather than migrated or deleted: nothing a family
 * already has is destroyed, and nothing incomparable is silently mixed in with
 * the new results.
 */
const KEY = "kaushalya.assessments.v2";

export interface StoredAssessment extends Assessment {
  /**
   * Stages presented per competence, in the order the ladder walk asked them.
   * Starts as one stage each and grows as the walk climbs or descends.
   */
  stagesByDomain: Record<DomainCode, string[]>;
}

type Table = Record<string, StoredAssessment>;

function read(): Table {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Table;
  } catch {
    return {};
  }
}

function write(table: Table): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(table));
  } catch {
    // Private browsing, or storage full. The in-page session still works;
    // the assessment just will not survive a refresh.
  }
}

function newId(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

export function createAssessment(
  child: Child,
  assessedOn: string,
  stagesByDomain: Record<DomainCode, string[]>,
): StoredAssessment {
  const record: StoredAssessment = {
    id: newId(),
    child,
    assessedOn,
    responses: {},
    details: {},
    stagesByDomain,
    bankVersion: BANK_VERSION,
  };
  const table = read();
  table[record.id] = record;
  write(table);
  return record;
}

export function getAssessment(id: string): StoredAssessment | null {
  return read()[id] ?? null;
}

export function saveResponse(
  id: string,
  itemId: string,
  value: ResponseValue,
): void {
  const table = read();
  const record = table[id];
  if (!record) return;
  record.responses[itemId] = value;
  write(table);
}

/** Records a non-scoring observation — a count, a percentage, which hand. */
export function saveDetail(id: string, itemId: string, value: string): void {
  const table = read();
  const record = table[id];
  if (!record) return;
  record.details = { ...(record.details ?? {}), [itemId]: value };
  write(table);
}

/**
 * Records the next stage the ladder walk opened up for one competence.
 *
 * Called once per step of the walk, so a reload mid-assessment resumes with
 * exactly the stages the parent had already been asked — not a fresh walk that
 * might take a different path.
 */
export function appendStage(
  id: string,
  domain: DomainCode,
  stage: string,
): void {
  const table = read();
  const record = table[id];
  if (!record) return;
  const existing = record.stagesByDomain[domain] ?? [];
  if (existing.includes(stage)) return;
  record.stagesByDomain[domain] = [...existing, stage];
  write(table);
}

export function completeAssessment(id: string): void {
  const table = read();
  const record = table[id];
  if (!record) return;
  record.completedAt = new Date().toISOString();
  write(table);
}

export function listAssessments(): StoredAssessment[] {
  return Object.values(read()).sort((a, b) =>
    b.assessedOn.localeCompare(a.assessedOn),
  );
}

export function deleteAssessment(id: string): void {
  const table = read();
  delete table[id];
  write(table);
}

export function assessmentsForChild(childId: string): StoredAssessment[] {
  return listAssessments().filter((a) => a.child.id === childId);
}

export function latestAssessmentForChild(
  childId: string,
): StoredAssessment | null {
  const all = assessmentsForChild(childId);
  return all.find((a) => a.completedAt) ?? all[0] ?? null;
}

/* ── children ───────────────────────────────────────────────────────────────
 * A lightweight local "family" of child profiles, so a parent can create one
 * or several children and come back to any of them. Same localStorage-only
 * caveat as assessments — see the note above the assessment table.
 * ────────────────────────────────────────────────────────────────────────── */

const CHILD_KEY = "kaushalya.children.v1";

/** A child once saved always has an id and a createdAt. */
export type SavedChild = Child & { id: string; createdAt: string };

type ChildTable = Record<string, SavedChild>;

function readChildren(): ChildTable {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CHILD_KEY) ?? "{}") as ChildTable;
  } catch {
    return {};
  }
}

function writeChildren(table: ChildTable): void {
  try {
    window.localStorage.setItem(CHILD_KEY, JSON.stringify(table));
  } catch {
    // Private browsing, or storage full — the session still works.
  }
}

export function createChild(
  input: Omit<Child, "id" | "createdAt">,
): SavedChild {
  const child: SavedChild = {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  const table = readChildren();
  table[child.id] = child;
  writeChildren(table);
  return child;
}

export function listChildren(): SavedChild[] {
  return Object.values(readChildren()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function getChild(id: string): SavedChild | null {
  return readChildren()[id] ?? null;
}

export function updateChild(id: string, patch: Partial<Child>): void {
  const table = readChildren();
  const existing = table[id];
  if (!existing) return;
  table[id] = { ...existing, ...patch, id: existing.id };
  writeChildren(table);
}

export function deleteChild(id: string): void {
  const table = readChildren();
  delete table[id];
  writeChildren(table);
}

/* ── payment (mock) ────────────────────────────────────────────────────────
 * No payment gateway is wired up yet. The only working path today is the
 * coupon — this just records that a child unlocked a given assessment, so
 * the pay screen does not ask twice.
 * ────────────────────────────────────────────────────────────────────────── */

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
