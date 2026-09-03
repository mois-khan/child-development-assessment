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
import { AGE_BANDS, DOMAINS, bandIdsForModule } from "@/content/domains";
import { ITEMS, itemsForModule as baseItemsForModule } from "@/content/items";
import type { DomainCode, Item, ItemSource } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const OVERLAY_KEY = "kaushalya.admin.item-drafts.v1";

export type ItemStatus = "base" | "edited" | "new" | "deleted";

export interface AdminItem extends Item {
  status: ItemStatus;
}

export interface ItemInput {
  id?: string; // omit to create a new item
  domain: DomainCode;
  band: string;
  text: string;
  how: string;
  source: ItemSource;
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

function newDraftId(domain: DomainCode, band: string): string {
  return `${band}-${domain}-draft-${Date.now().toString(36)}`;
}

/** The merge itself, with no Supabase check — shared by the admin list (which
 * throws when Supabase is configured, since that path isn't wired up) and
 * liveItemsForModule() below (which must never throw — it's on the parent's
 * actual assessment path). */
function mergedItems(filter?: { domain?: DomainCode; band?: string }): AdminItem[] {
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
    .filter((i) => (filter?.band ? i.band === filter.band : true))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function adminListItems(filter?: { domain?: DomainCode; band?: string }): AdminItem[] {
  if (isSupabaseConfigured()) {
    // TODO: once credentials exist, read from the `items` table filtered to
    // bank_version = 'draft', joined with item_bank_versions for status.
    throw new Error("Supabase-backed item bank is not wired up yet.");
  }
  return mergedItems(filter);
}

/**
 * What a parent taking the assessment actually sees for one section of one
 * module: the shipped item bank, with any admin edits/additions/deletions
 * from lib/admin/content.ts applied on top. Falls back to the plain shipped
 * bank when Supabase is configured, since admin content doesn't live there
 * yet — see the TODO on adminListItems above.
 */
export function liveItemsForModule(moduleId: number, domain: DomainCode): Item[] {
  if (isSupabaseConfigured()) {
    return baseItemsForModule(moduleId, domain);
  }
  const bands = bandIdsForModule(moduleId);
  return bands.flatMap((band) => mergedItems({ domain, band }));
}

export function adminSaveItem(input: ItemInput): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed item bank is not wired up yet.");
  }
  const overlay = readOverlay();
  const id = input.id ?? newDraftId(input.domain, input.band);
  overlay[id] = {
    id,
    domain: input.domain,
    band: input.band,
    text: input.text,
    how: input.how,
    source: input.source,
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
export const ADMIN_AGE_BANDS = AGE_BANDS;
