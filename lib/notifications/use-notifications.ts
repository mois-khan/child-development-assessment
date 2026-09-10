"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/provider";
import type { NotificationType } from "@/lib/supabase/database.types";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * The signed-in user's notification inbox, kept live.
 *
 * A Realtime channel rather than polling: notifications are rare enough
 * (a handful a week per family) that polling would mean either a stale
 * bell for minutes at a time or wasted requests every few seconds to catch
 * the rare one that matters. One channel, filtered to this user's own
 * rows — see the `alter publication` line in 0008_notifications.sql.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, url, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    setItems(
      (data ?? []).map((n) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        body: n.body,
        url: n.url,
        readAt: n.read_at,
        createdAt: n.created_at,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    load(user.id);

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (!active) return;
          const n = payload.new as any;
          setItems((prev) => [
            {
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              url: n.url,
              readAt: n.read_at,
              createdAt: n.created_at,
            },
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const unreadCount = items.filter((n) => !n.readAt).length;

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    const supabase = getSupabaseBrowserClient();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = items.filter((n) => !n.readAt);
    if (unread.length === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from("notifications")
      .update({ read_at: now })
      .in("id", unread.map((n) => n.id));
  }, [items]);

  return { items, loading, unreadCount, markRead, markAllRead };
}
