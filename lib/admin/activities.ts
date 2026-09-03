"use client";

/**
 * Activity editing — same overlay approach as lib/admin/content.ts (see that
 * file's header for the full rationale). content/activities.ts stays
 * untouched; edits, additions and deletions live in a localStorage overlay
 * merged on read, until Supabase is connected.
 *
 * videoId is admin-only: it is not part of the shared Activity type
 * (lib/types.ts). The report page (app/report/[id]/page.tsx) looks it up
 * itself via liveGetVideo() rather than this type growing a field only it
 * cares about.
 */
import { DOMAINS, STAGE_FOR_BAND } from "@/content/domains";
import { ACTIVITIES, activitiesFor as baseActivitiesFor } from "@/content/activities";
import type { Activity, DomainCode } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ItemStatus } from "./content";

export type { ItemStatus };

const OVERLAY_KEY = "kaushalya.admin.activity-drafts.v1";

export interface AdminActivity extends Activity {
  status: ItemStatus;
  videoId?: string;
}

export interface ActivityInput {
  id?: string;
  domain: DomainCode;
  stage: string;
  title: string;
  description: string;
  materials: string;
  minutes: number;
  frequency: string;
  videoId?: string;
}

interface OverlayEntry extends Activity {
  videoId?: string;
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
  return `${domain}-${stage}-draft-${Date.now().toString(36)}`;
}

/** The merge itself, shared by the throwing admin list and the safe live
 * lookup below — see the equivalent split in lib/admin/content.ts. */
function mergedActivities(filter?: { domain?: DomainCode; stage?: string }): AdminActivity[] {
  const overlay = readOverlay();
  const baseIds = new Set(ACTIVITIES.map((a) => a.id));

  const merged: AdminActivity[] = [];
  for (const base of ACTIVITIES) {
    const override = overlay[base.id];
    if (override?.deleted) continue;
    merged.push(
      override
        ? { ...override, status: "edited" }
        : { ...base, status: "base" },
    );
  }
  for (const [id, entry] of Object.entries(overlay)) {
    if (baseIds.has(id) || entry.deleted) continue;
    merged.push({ ...entry, status: "new" });
  }

  return merged
    .filter((a) => (filter?.domain ? a.domain === filter.domain : true))
    .filter((a) => (filter?.stage ? a.stage === filter.stage : true))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function adminListActivities(filter?: { domain?: DomainCode; stage?: string }): AdminActivity[] {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed activities are not wired up yet.");
  }
  return mergedActivities(filter);
}

/**
 * What a parent's report actually shows for one domain at one age band: the
 * shipped activities, with any admin edits/additions/deletions applied.
 * Falls back to the plain shipped set when Supabase is configured, since
 * admin activities don't live there yet — see adminListActivities above.
 */
export function liveActivitiesFor(domain: DomainCode, band: string): AdminActivity[] {
  if (isSupabaseConfigured()) {
    return baseActivitiesFor(domain, band).map((a) => ({ ...a, status: "base" as const }));
  }
  const stage = STAGE_FOR_BAND[band];
  return mergedActivities({ domain, stage });
}

export function adminSaveActivity(input: ActivityInput): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed activities are not wired up yet.");
  }
  const overlay = readOverlay();
  const id = input.id ?? newDraftId(input.domain, input.stage);
  overlay[id] = {
    id,
    domain: input.domain,
    stage: input.stage,
    title: input.title,
    description: input.description,
    materials: input.materials,
    minutes: input.minutes,
    frequency: input.frequency,
    videoId: input.videoId,
  };
  writeOverlay(overlay);
}

export function adminDeleteActivity(id: string): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed activities are not wired up yet.");
  }
  const overlay = readOverlay();
  const isBase = ACTIVITIES.some((a) => a.id === id);
  if (isBase) {
    const existing = overlay[id] ?? ACTIVITIES.find((a) => a.id === id)!;
    overlay[id] = { ...existing, deleted: true };
  } else {
    delete overlay[id];
  }
  writeOverlay(overlay);
}

export function adminRevertActivity(id: string): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed activities are not wired up yet.");
  }
  const overlay = readOverlay();
  delete overlay[id];
  writeOverlay(overlay);
}

export const ADMIN_ACTIVITY_DOMAINS = DOMAINS;
