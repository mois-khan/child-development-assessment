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
 * without touching the shipped file. The merged result (base + overlay) is
 * what adminListItems() returns, so the admin portal already behaves like a
 * real editable item bank — the only difference from the real thing is that
 * edits live in this browser rather than a shared database, and there's no
 * enforced draft/publish boundary (nothing else reads this overlay, so
 * there's nothing to accidentally publish early). Both of those become real
 * the moment isSupabaseConfigured() is true — see the TODOs below for where
 * that logic slots in.
 */
import { AGE_BANDS, DOMAINS } from "@/content/domains";
import { ITEMS } from "@/content/items";
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

export function adminListItems(filter?: { domain?: DomainCode; band?: string }): AdminItem[] {
  if (isSupabaseConfigured()) {
    // TODO: once credentials exist, read from the `items` table filtered to
    // bank_version = 'draft', joined with item_bank_versions for status.
    throw new Error("Supabase-backed item bank is not wired up yet.");
  }

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
