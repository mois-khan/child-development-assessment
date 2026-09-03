"use client";

/**
 * Courses — same "no shipped base content" shape as lib/admin/videos.ts.
 * Pure localStorage CRUD in dev mode; moves to the `courses` table
 * (0002_admin.sql) once Supabase is connected.
 */
import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const COURSES_KEY = "kaushalya.admin.courses.v1";

export interface AdminCourse {
  id: string;
  code: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  thumbnailUrl?: string;
  checkoutUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CourseInput {
  id?: string;
  code: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  thumbnailUrl?: string;
  checkoutUrl?: string;
  isActive: boolean;
}

function read(): Record<string, AdminCourse> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(COURSES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function write(table: Record<string, AdminCourse>): void {
  window.localStorage.setItem(COURSES_KEY, JSON.stringify(table));
}

function newId(): string {
  return `course-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function adminListCourses(): AdminCourse[] {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed courses are not wired up yet.");
  }
  return Object.values(read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function adminSaveCourse(input: CourseInput): AdminCourse {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed courses are not wired up yet.");
  }
  const table = read();
  const id = input.id ?? newId();
  const existing = input.id ? table[input.id] : undefined;
  const course: AdminCourse = {
    id,
    code: input.code,
    title: input.title,
    description: input.description,
    price: input.price,
    currency: input.currency,
    thumbnailUrl: input.thumbnailUrl,
    checkoutUrl: input.checkoutUrl,
    isActive: input.isActive,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  table[id] = course;
  write(table);
  return course;
}

export function adminDeleteCourse(id: string): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed courses are not wired up yet.");
  }
  const table = read();
  delete table[id];
  write(table);
}

export function useAdminCourses(): { courses: AdminCourse[]; refresh: () => void } {
  const [courses, setCourses] = useState<AdminCourse[]>([]);

  const refresh = useCallback(() => {
    if (isSupabaseConfigured()) return;
    setCourses(adminListCourses());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { courses, refresh };
}
