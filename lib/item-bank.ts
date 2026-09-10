/**
 * The live item bank: content/items.ts with admin edits layered on top.
 *
 * WHY THIS IS SYNCHRONOUS, AND WHAT THAT COSTS
 *
 * The assessment walk (app/assessment/[id]/page.tsx) and the scoring engine
 * (lib/scoring.ts) both ask "what are the questions for this cell?" inside
 * loops, memos and render passes — dozens of times per keystroke. If that
 * question returned a promise, every one of those call sites would have to
 * become async, and the walk's "answer → decide next stage → append" step
 * would stop being a pure function of stored state.
 *
 * So reads stay synchronous and the overlay lives in a module-level cache.
 * Exactly one async step exists: `primeItemBank()`, which every page that
 * shows or scores questions awaits once before rendering them. Until it has
 * resolved, `itemBankReady()` is false and callers show a loading state
 * rather than the un-overlaid bank — showing base questions for a moment and
 * then swapping them mid-assessment would be worse than a spinner.
 *
 * WHERE THE OVERLAY LIVES
 *
 *   Supabase configured → public.item_overrides (0006_item_bank.sql).
 *                         Shared across devices, admin-writable, readable by
 *                         everyone because parents are asked these questions.
 *   Not configured      → localStorage, exactly as before, so a fresh clone
 *                         with no credentials still runs end to end.
 */
import { ITEMS, itemsFor as baseItemsFor } from "@/content/items";
import type { DomainCode, Item, ItemKind, ItemSource } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const OVERLAY_KEY = "kaushalya.admin.item-drafts.v1";

export type ItemStatus = "base" | "edited" | "new" | "deleted";

export interface AdminItem extends Item {
  status: ItemStatus;
}

export interface ItemInput {
  /** Omit to create a new item. */
  id?: string;
  domain: DomainCode;
  stage: string;
  text: string;
  how: string;
  kind: ItemKind;
  source: ItemSource;
  invert?: boolean;
  minAgeMonths?: number;
}

export interface OverlayEntry extends Item {
  deleted?: boolean;
}

type Overlay = Record<string, OverlayEntry>;

/* ══ the cache ═════════════════════════════════════════════════════════════ */

let cache: Overlay | null = null;
let inflight: Promise<Overlay> | null = null;

/** True once the overlay has been fetched at least once this page load. */
export function itemBankReady(): boolean {
  return cache !== null;
}

/**
 * Fetch the overlay into the cache. Safe to call from many components at
 * once — concurrent calls share the one request. Pass `force` after an admin
 * write to pick the change up.
 */
export async function primeItemBank(opts?: { force?: boolean }): Promise<void> {
  if (cache !== null && !opts?.force) return;
  if (inflight && !opts?.force) {
    await inflight;
    return;
  }
  inflight = fetchOverlay();
  try {
    cache = await inflight;
  } finally {
    inflight = null;
  }
}

async function fetchOverlay(): Promise<Overlay> {
  if (!isSupabaseConfigured()) return readLocalOverlay();

  // Imported lazily so this module stays importable from server code that
  // will never touch the browser client.
  const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const { data, error } = await getSupabaseBrowserClient()
    .from("item_overrides")
    .select("*");

  // A failed fetch must not take the assessment down with it. The shipped
  // bank is a complete, valid instrument on its own — falling back to it
  // costs the admin's recent edits, not the parent's session.
  if (error || !data) {
    console.error("Item bank overlay failed to load; using the shipped bank.", error);
    return {};
  }

  const overlay: Overlay = {};
  for (const row of data) overlay[row.id] = rowToEntry(row);
  return overlay;
}

/* ══ row ⇄ item ════════════════════════════════════════════════════════════ */

interface Row {
  id: string;
  domain: string;
  stage_id: string;
  text: string;
  how: string;
  kind: string;
  source: string;
  invert: boolean;
  min_age_months: number | null;
  choices: string[] | null;
  unit: string | null;
  deleted: boolean;
}

function rowToEntry(row: Row): OverlayEntry {
  return {
    id: row.id,
    domain: row.domain as DomainCode,
    stage: row.stage_id,
    text: row.text,
    how: row.how,
    kind: row.kind as ItemKind,
    source: row.source as ItemSource,
    ...(row.invert ? { invert: true as const } : {}),
    ...(row.min_age_months !== null ? { minAgeMonths: row.min_age_months } : {}),
    ...(row.choices && row.choices.length === 2
      ? { choices: [row.choices[0], row.choices[1]] as [string, string] }
      : {}),
    ...(row.unit ? { unit: row.unit } : {}),
    ...(row.deleted ? { deleted: true } : {}),
  };
}

/* ══ localStorage fallback ═════════════════════════════════════════════════ */

function readLocalOverlay(): Overlay {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(OVERLAY_KEY) ?? "{}") as Overlay;
  } catch {
    return {};
  }
}

function writeLocalOverlay(table: Overlay): void {
  window.localStorage.setItem(OVERLAY_KEY, JSON.stringify(table));
  cache = table;
}

/* ══ the merge ═════════════════════════════════════════════════════════════ */

/**
 * The shipped bank with the overlay applied: edits replace, retirements drop,
 * additions append.
 */
function mergedItems(filter?: { domain?: DomainCode; stage?: string }): AdminItem[] {
  const overlay = cache ?? {};
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
  return mergedItems(filter);
}

/**
 * What a parent is actually asked for one cell of the chart.
 *
 * `assessedMonths` drops the booklet's "if over six…" questions for a younger
 * child, exactly as content/items.ts does.
 */
export function liveItemsFor(
  stage: string,
  domain: DomainCode,
  assessedMonths?: number,
): Item[] {
  // Before priming, and on a server render, there is no overlay to apply —
  // answer from the shipped bank rather than inventing a half-merged one.
  if (cache === null) return baseItemsFor(stage, domain, assessedMonths);

  return mergedItems({ domain, stage }).filter(
    (i) =>
      assessedMonths === undefined ||
      i.minAgeMonths === undefined ||
      assessedMonths >= i.minAgeMonths,
  );
}

/** Only the questions that count towards passing a stage. */
export function liveScoredItemsFor(
  stage: string,
  domain: DomainCode,
  assessedMonths?: number,
): Item[] {
  return liveItemsFor(stage, domain, assessedMonths).filter((i) => i.kind === "yesno");
}

/* ══ writes ════════════════════════════════════════════════════════════════ */

function newDraftId(domain: DomainCode, stage: string): string {
  return `${stage}-${domain}-draft-${Date.now().toString(36)}`;
}

/** Create or update an item. Resolves once the change is readable again. */
export async function adminSaveItem(input: ItemInput): Promise<void> {
  const id = input.id ?? newDraftId(input.domain, input.stage);
  const entry: OverlayEntry = {
    id,
    domain: input.domain,
    stage: input.stage,
    text: input.text,
    how: input.how,
    kind: input.kind,
    source: input.source,
    ...(input.invert ? { invert: true as const } : {}),
    ...(input.minAgeMonths !== undefined ? { minAgeMonths: input.minAgeMonths } : {}),
  };

  if (!isSupabaseConfigured()) {
    writeLocalOverlay({ ...readLocalOverlay(), [id]: entry });
    return;
  }

  const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const { error } = await getSupabaseBrowserClient()
    .from("item_overrides")
    .upsert({
      id,
      domain: input.domain,
      stage_id: input.stage,
      text: input.text,
      how: input.how,
      kind: input.kind,
      source: input.source,
      invert: input.invert ?? false,
      min_age_months: input.minAgeMonths ?? null,
      deleted: false,
    });
  if (error) throw new Error(`Couldn't save that question: ${error.message}`);
  await primeItemBank({ force: true });
}

/**
 * Retire an item.
 *
 * A base item gets a `deleted` row — the shipped question still exists in
 * content/items.ts, and without a row saying otherwise it would come straight
 * back. An admin-authored addition has no base to fall back to, so its row is
 * removed outright.
 */
export async function adminDeleteItem(id: string): Promise<void> {
  const base = ITEMS.find((i) => i.id === id);

  if (!isSupabaseConfigured()) {
    const overlay = readLocalOverlay();
    if (base) overlay[id] = { ...(overlay[id] ?? base), deleted: true };
    else delete overlay[id];
    writeLocalOverlay(overlay);
    return;
  }

  const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const supabase = getSupabaseBrowserClient();

  if (base) {
    const current = (cache ?? {})[id] ?? base;
    const { error } = await supabase.from("item_overrides").upsert({
      id,
      domain: current.domain,
      stage_id: current.stage,
      text: current.text,
      how: current.how,
      kind: current.kind,
      source: current.source,
      invert: current.invert ?? false,
      min_age_months: current.minAgeMonths ?? null,
      deleted: true,
    });
    if (error) throw new Error(`Couldn't retire that question: ${error.message}`);
  } else {
    const { error } = await supabase.from("item_overrides").delete().eq("id", id);
    if (error) throw new Error(`Couldn't remove that question: ${error.message}`);
  }
  await primeItemBank({ force: true });
}

/** Undo an edit or a retirement, restoring the shipped wording. */
export async function adminRevertItem(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const overlay = readLocalOverlay();
    delete overlay[id];
    writeLocalOverlay(overlay);
    return;
  }

  const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const { error } = await getSupabaseBrowserClient()
    .from("item_overrides")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Couldn't restore that question: ${error.message}`);
  await primeItemBank({ force: true });
}

/** How many items currently differ from the shipped bank. */
export function overlayCount(): number {
  return Object.keys(cache ?? {}).length;
}
