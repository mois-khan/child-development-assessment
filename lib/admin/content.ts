"use client";

/**
 * Item bank editing.
 *
 * content/items.ts is static TypeScript, compiled into the app — there is no
 * way for a browser to rewrite it, and there won't be until Supabase is
 * connected and items live in the `items` table (0001_init.sql) instead.
 *
 * Until then, this keeps admin edits in a localStorage overlay: every base
 * item can be edited or soft-deleted, and new items can be added, all
 * without touching the shipped file. adminListItems() (admin UI) and
 * liveItemsForModule() (the real assessment, via app/assessment/[id]/page.tsx)
 * read the same merged result — so an edit is live for any parent using this
 * browser immediately, no draft/publish step. That immediacy is right for a
 * single-admin dev browser; once Supabase is connected, item_bank_versions
 * (0002_admin.sql) brings back a real draft → publish boundary so edits
 * don't reach parents mid-assessment.
 */
import { DOMAINS } from "@/content/domains";
import { BRAIN_STAGES } from "@/content/stages";
import { ITEMS, itemsFor as baseItemsFor } from "@/content/items";
import type { DomainCode, Item, ItemKind, ItemSource } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const OVERLAY_KEY = "kaushalya.admin.item-drafts.v1";

export type ItemStatus = "base" | "edited" | "new" | "deleted";

export interface AdminItem extends Item {
  status: ItemStatus;
}

export interface ItemInput {
  id?: string; // omit to create a new item
  domain: DomainCode;
  stage: string;
  text: string;
  how: string;
  kind: ItemKind;
  source: ItemSource;
  invert?: boolean;
  minAgeMonths?: number;
}

interface OverlayEntry extends Item {
  deleted?: boolean;
}

function readOverlay(): Record<string, OverlayEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(OVERLAY_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeOverlay(table: Record<string, OverlayEntry>): void {
  window.localStorage.setItem(OVERLAY_KEY, JSON.stringify(table));
}

function newDraftId(domain: DomainCode, stage: string): string {
  return `${stage}-${domain}-draft-${Date.now().toString(36)}`;
}

/** The merge itself, with no Supabase check — shared by the admin list (which
 * throws when Supabase is configured, since that path isn't wired up) and
 * liveItemsForModule() below (which must never throw — it's on the parent's
 * actual assessment path). */
function mergedItems(filter?: { domain?: DomainCode; stage?: string }): AdminItem[] {
  const overlay = readOverlay();
  const baseIds = new Set(ITEMS.map((i) => i.id));

  const merged: AdminItem[] = [];
  for (const base of ITEMS) {
    const override = overlay[base.id];
    if (override?.deleted) continue;
    merged.push(override ? { ...override, status: "edited" } : { ...base, status: "base" });
  }
  for (const [id, entry] of Object.entries(overlay)) {
    if (baseIds.has(id) || entry.deleted) continue;
    merged.push({ ...entry, status: "new" });
  }

  return merged
    .filter((i) => (filter?.domain ? i.domain === filter.domain : true))
    .filter((i) => (filter?.stage ? i.stage === filter.stage : true))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function adminListItems(filter?: { domain?: DomainCode; stage?: string }): AdminItem[] {
  if (isSupabaseConfigured()) {
    // TODO: once credentials exist, read from the `items` table filtered to
    // bank_version = 'draft', joined with item_bank_versions for status.
    throw new Error("Supabase-backed item bank is not wired up yet.");
  }
  return mergedItems(filter);
}

/**
 * What a parent taking the assessment actually sees for one cell of the chart:
 * the shipped item bank, with any admin edits/additions/deletions applied on
 * top. Falls back to the plain shipped bank when Supabase is configured, since
 * admin content doesn't live there yet — see the TODO on adminListItems above.
 *
 * `assessedMonths` drops the booklet's "if over six…" questions for a younger
 * child, exactly as content/items.ts does.
 */
export function liveItemsFor(
  stage: string,
  domain: DomainCode,
  assessedMonths?: number,
): Item[] {
  const items = isSupabaseConfigured()
    ? baseItemsFor(stage, domain, assessedMonths)
    : mergedItems({ domain, stage }).filter(
        (i) =>
          assessedMonths === undefined ||
          i.minAgeMonths === undefined ||
          assessedMonths >= i.minAgeMonths,
      );
  return items;
}

/** Only the questions that count towards passing a stage. */
export function liveScoredItemsFor(
  stage: string,
  domain: DomainCode,
  assessedMonths?: number,
): Item[] {
  return liveItemsFor(stage, domain, assessedMonths).filter((i) => i.kind === "yesno");
}

export function adminSaveItem(input: ItemInput): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed item bank is not wired up yet.");
  }
  const overlay = readOverlay();
  const id = input.id ?? newDraftId(input.domain, input.stage);
  overlay[id] = {
    id,
    domain: input.domain,
    stage: input.stage,
    text: input.text,
    how: input.how,
    kind: input.kind,
    source: input.source,
    ...(input.invert ? { invert: true as const } : {}),
    ...(input.minAgeMonths !== undefined
      ? { minAgeMonths: input.minAgeMonths }
      : {}),
  };
  writeOverlay(overlay);
}

export function adminDeleteItem(id: string): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed item bank is not wired up yet.");
  }
  const overlay = readOverlay();
  const isBaseItem = ITEMS.some((i) => i.id === id);
  if (isBaseItem) {
    const existing = overlay[id] ?? ITEMS.find((i) => i.id === id)!;
    overlay[id] = { ...existing, deleted: true };
  } else {
    delete overlay[id]; // a draft-only addition — just remove it entirely
  }
  writeOverlay(overlay);
}

/** Undo an edit or a deletion, reverting a base item back to its shipped content. */
export function adminRevertItem(id: string): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed item bank is not wired up yet.");
  }
  const overlay = readOverlay();
  delete overlay[id];
  writeOverlay(overlay);
}

export function adminHasDrafts(): boolean {
  if (isSupabaseConfigured()) return false;
  return Object.keys(readOverlay()).length > 0;
}

export const ADMIN_DOMAINS = DOMAINS;
export const ADMIN_STAGES = BRAIN_STAGES;
