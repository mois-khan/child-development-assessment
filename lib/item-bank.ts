/**
 * The item bank: every question a parent can be asked, read straight from
 * storage. There is no code-level base bank any more — `public.item_overrides`
 * (0006_item_bank.sql, promoted to sole source by 0018_item_bank_is_sole_source.sql)
 * is not a diff on top of anything, it is the entire question set. Editing a
 * question here is editing what the next parent is asked; there is no
 * "shipped wording" left to fall back to or revert to.
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
 * So reads stay synchronous and the bank lives in a module-level cache.
 * Exactly one async step exists: `primeItemBank()`, which every page that
 * shows or scores questions awaits once before rendering them. Until it has
 * resolved, `itemBankReady()` is false and callers show a loading state.
 * If it rejects, `itemBankLoadFailed()` is true and callers must show a
 * blocking error rather than proceed with — or silently render — no
 * questions at all; there is nothing to fall back to any more.
 *
 * WHERE THE BANK LIVES
 *
 *   Supabase configured → public.item_overrides. Shared across devices,
 *                         admin-writable, readable by everyone because
 *                         parents are asked these questions.
 *   Not configured      → localStorage, so a fresh clone with no credentials
 *                         still has somewhere to save admin-authored
 *                         questions locally. It starts empty; there is no
 *                         shipped content to seed it with.
 */
import type { DomainCode, Item, ItemKind, ItemSource } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const BANK_KEY = "kaushalya.admin.item-drafts.v1";

export type ItemStatus = "active" | "deleted";

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
  /** Only meaningful when kind is "choice". */
  choices?: [string, string];
  /** Only meaningful when kind is "count" or "percent". */
  unit?: string;
}

export interface BankEntry extends Item {
  deleted?: boolean;
}

type Bank = Record<string, BankEntry>;

/* ══ the cache ═════════════════════════════════════════════════════════════ */

let cache: Bank | null = null;
let loadFailed = false;
let inflight: Promise<Bank> | null = null;

/** True once the bank has been fetched at least once this page load. */
export function itemBankReady(): boolean {
  return cache !== null;
}

/** True if the last `primeItemBank()` failed to load a configured bank. */
export function itemBankLoadFailed(): boolean {
  return loadFailed;
}

/**
 * Fetch the bank into the cache. Safe to call from many components at once —
 * concurrent calls share the one request. Pass `force` after an admin write
 * to pick the change up. Rejects (and leaves `itemBankReady()` false) if
 * Supabase is configured but the fetch fails — there is no shipped bank left
 * to fall back to, so callers must show a blocking error rather than guess.
 */
export async function primeItemBank(opts?: { force?: boolean }): Promise<void> {
  if (cache !== null && !opts?.force) return;
  if (inflight && !opts?.force) {
    await inflight;
    return;
  }
  inflight = fetchBank();
  try {
    cache = await inflight;
    loadFailed = false;
  } catch (e) {
    loadFailed = true;
    throw e;
  } finally {
    inflight = null;
  }
}

async function fetchBank(): Promise<Bank> {
  if (!isSupabaseConfigured()) return readLocalBank();

  // Imported lazily so this module stays importable from server code that
  // will never touch the browser client.
  const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const { data, error } = await getSupabaseBrowserClient()
    .from("item_overrides")
    .select("*");

  if (error || !data) {
    throw new Error(error?.message ?? "Couldn't load the question bank.");
  }

  const bank: Bank = {};
  for (const row of data) bank[row.id] = rowToEntry(row);
  return bank;
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

function rowToEntry(row: Row): BankEntry {
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

function readLocalBank(): Bank {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(BANK_KEY) ?? "{}") as Bank;
  } catch {
    return {};
  }
}

function writeLocalBank(table: Bank): void {
  window.localStorage.setItem(BANK_KEY, JSON.stringify(table));
  cache = table;
}

/* ══ reads ═════════════════════════════════════════════════════════════════ */

function allItems(filter?: { domain?: DomainCode; stage?: string }): AdminItem[] {
  const bank = cache ?? {};
  const items: AdminItem[] = [];
  for (const entry of Object.values(bank)) {
    if (entry.deleted) continue;
    items.push({ ...entry, status: "active" });
  }
  return items
    .filter((i) => (filter?.domain ? i.domain === filter.domain : true))
    .filter((i) => (filter?.stage ? i.stage === filter.stage : true))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function adminListItems(filter?: { domain?: DomainCode; stage?: string }): AdminItem[] {
  return allItems(filter);
}

/**
 * What a parent is actually asked for one cell of the chart.
 *
 * `assessedMonths` drops the booklet's "if over six…" questions for a younger
 * child. Before the bank has been primed there is nothing to answer from —
 * callers gate on `itemBankReady()` and show a loading (or, on failure, a
 * blocking error) state rather than rendering an empty cell as if it were
 * complete.
 */
export function liveItemsFor(
  stage: string,
  domain: DomainCode,
  assessedMonths?: number,
): Item[] {
  if (cache === null) return [];

  return allItems({ domain, stage }).filter(
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

function newItemId(domain: DomainCode, stage: string): string {
  return `${stage}-${domain}-${Date.now().toString(36)}`;
}

/** Create or update an item. Resolves once the change is readable again. */
export async function adminSaveItem(input: ItemInput): Promise<void> {
  const id = input.id ?? newItemId(input.domain, input.stage);
  const entry: BankEntry = {
    id,
    domain: input.domain,
    stage: input.stage,
    text: input.text,
    how: input.how,
    kind: input.kind,
    source: input.source,
    ...(input.invert ? { invert: true as const } : {}),
    ...(input.minAgeMonths !== undefined ? { minAgeMonths: input.minAgeMonths } : {}),
    ...(input.choices ? { choices: input.choices } : {}),
    ...(input.unit ? { unit: input.unit } : {}),
  };

  if (!isSupabaseConfigured()) {
    writeLocalBank({ ...readLocalBank(), [id]: entry });
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
      choices: input.choices ?? null,
      unit: input.unit ?? null,
      deleted: false,
    });
  if (error) throw new Error(`Couldn't save that question: ${error.message}`);
  await primeItemBank({ force: true });
}

/** Remove a question from the bank for good — there is no shipped fallback
 *  for it to reappear from, so this is a hard delete, not a soft retirement. */
export async function adminDeleteItem(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const bank = readLocalBank();
    delete bank[id];
    writeLocalBank(bank);
    return;
  }

  const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const { error } = await getSupabaseBrowserClient()
    .from("item_overrides")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Couldn't remove that question: ${error.message}`);
  await primeItemBank({ force: true });
}

/** How many questions are currently in the bank. */
export function itemBankSize(): number {
  return allItems().length;
}

/**
 * Test-only seam: load the cache directly from a fixture, bypassing Supabase
 * and localStorage entirely. Scoring tests need a real, primed bank — there
 * is no shipped fallback for `liveItemsFor` to return when nothing has been
 * fetched — so they call this with a known set of items instead of hitting
 * the network.
 */
export function __setItemBankForTests(items: Item[]): void {
  cache = {};
  for (const item of items) cache[item.id] = item;
  loadFailed = false;
}
