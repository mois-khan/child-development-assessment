"use client";

/**
 * Video library.
 *
 * Unlike items/activities there's no static content/*.ts file this overlays
 * — videos are new, admin-authored content with no shipped starting set. In
 * dev mode they live entirely in localStorage; once Supabase is connected
 * they move to the `videos` table (0002_admin.sql) and this becomes a real
 * shared library instead of a per-browser one.
 */
import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const VIDEOS_KEY = "kaushalya.admin.videos.v1";

export type VideoProvider = "youtube" | "vimeo" | "mp4";

export interface AdminVideo {
  id: string;
  title: string;
  provider: VideoProvider;
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  altText?: string;
  createdAt: string;
}

export interface VideoInput {
  id?: string;
  title: string;
  provider: VideoProvider;
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  altText?: string;
}

function read(): Record<string, AdminVideo> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(VIDEOS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function write(table: Record<string, AdminVideo>): void {
  window.localStorage.setItem(VIDEOS_KEY, JSON.stringify(table));
}

function newId(): string {
  return `video-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Best-effort thumbnail for providers with a predictable public URL. No network call. */
export function deriveThumbnail(provider: VideoProvider, url: string): string | undefined {
  if (provider === "youtube") {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return undefined;
}

export function adminListVideos(): AdminVideo[] {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed video library is not wired up yet.");
  }
  return Object.values(read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function adminGetVideo(id: string): AdminVideo | null {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed video library is not wired up yet.");
  }
  return read()[id] ?? null;
}

/** Safe for the parent-facing report: null instead of throwing when Supabase
 * is configured, since the video library doesn't live there yet. */
export function liveGetVideo(id: string): AdminVideo | null {
  if (isSupabaseConfigured()) return null;
  return read()[id] ?? null;
}

export function adminSaveVideo(input: VideoInput): AdminVideo {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed video library is not wired up yet.");
  }
  const table = read();
  const id = input.id ?? newId();
  const existing = input.id ? table[input.id] : undefined;
  const video: AdminVideo = {
    id,
    title: input.title,
    provider: input.provider,
    url: input.url,
    thumbnailUrl: input.thumbnailUrl || deriveThumbnail(input.provider, input.url),
    durationSeconds: input.durationSeconds,
    altText: input.altText,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  table[id] = video;
  write(table);
  return video;
}

export function adminDeleteVideo(id: string): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed video library is not wired up yet.");
  }
  const table = read();
  delete table[id];
  write(table);
}

/** Shared by the video library page and the activity video-picker. */
export function useAdminVideos(): { videos: AdminVideo[]; refresh: () => void } {
  const [videos, setVideos] = useState<AdminVideo[]>([]);

  const refresh = useCallback(() => {
    if (isSupabaseConfigured()) return;
    setVideos(adminListVideos());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { videos, refresh };
}
