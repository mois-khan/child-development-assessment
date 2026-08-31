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

const KEY = "kaushalya.assessments.v1";

export interface StoredAssessment extends Assessment {
  /** Bands presented per domain, including any adaptive extension. */
  bandsByDomain: Record<DomainCode, string[]>;
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
  bandsByDomain: Record<DomainCode, string[]>,
): StoredAssessment {
  const record: StoredAssessment = {
    id: newId(),
    child,
    assessedOn,
    responses: {},
    bandsByDomain,
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

/** Records the extra bands the adaptive extension added for a domain. */
export function extendBands(
  id: string,
  extra: Record<DomainCode, string[]>,
): void {
  const table = read();
  const record = table[id];
  if (!record) return;
  for (const [domain, bands] of Object.entries(extra) as [
    DomainCode,
    string[],
  ][]) {
    const existing = record.bandsByDomain[domain] ?? [];
    record.bandsByDomain[domain] = Array.from(new Set([...existing, ...bands]));
  }
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
