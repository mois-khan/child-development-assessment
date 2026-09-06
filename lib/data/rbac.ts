import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminUser, AdminPage, AdminRole } from "@/lib/types/rbac";

// ---------------------------------------------------------------------------
// Admin Users
// ---------------------------------------------------------------------------

/**
 * Returns all rows from the admin_users table, each with its page_access
 * array populated by a separate fetch from admin_page_access joined
 * client-side (no RPC needed).
 */
export async function listAdminUsers(): Promise<AdminUser[]> {
  const supabase = getSupabaseBrowserClient();

  // 1. Fetch base user rows
  const { data: users, error: usersError } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });

  if (usersError)
    throw new Error(`Failed to fetch admin users: ${usersError.message}`);

  // 2. Fetch all page-access grants in one query
  const { data: grants, error: grantsError } = await supabase
    .from("admin_page_access")
    .select("admin_user_id, page_id");

  if (grantsError)
    throw new Error(`Failed to fetch admin page access: ${grantsError.message}`);

  // 3. Group page_ids by user id client-side
  const pagesByUser: Record<string, string[]> = {};
  for (const g of grants) {
    if (!pagesByUser[g.admin_user_id]) {
      pagesByUser[g.admin_user_id] = [];
    }
    pagesByUser[g.admin_user_id].push(g.page_id);
  }

  return (users as AdminUser[]).map((u) => ({
    ...u,
    page_access: pagesByUser[u.id] ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Admin Pages
// ---------------------------------------------------------------------------

/**
 * Returns all registered admin pages ordered by sort_order ascending.
 */
export async function listAdminPages(): Promise<AdminPage[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("admin_pages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch admin pages: ${error.message}`);
  return data as AdminPage[];
}

// ---------------------------------------------------------------------------
// Page Access — read
// ---------------------------------------------------------------------------

/**
 * Returns the list of page_id strings the given admin user has been granted.
 */
export async function getPageAccess(userId: string): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("admin_page_access")
    .select("page_id")
    .eq("admin_user_id", userId);

  if (error)
    throw new Error(`Failed to fetch page access for user ${userId}: ${error.message}`);

  return (data ?? []).map((row) => row.page_id as string);
}

// ---------------------------------------------------------------------------
// Page Access — write
// ---------------------------------------------------------------------------

/**
 * Replaces the user's *entire* page-access set atomically:
 *  1. Deletes all existing admin_page_access rows for this user.
 *  2. Inserts a fresh row for every pageId in the supplied array.
 *
 * Passing an empty array effectively revokes all access.
 */
export async function setPageAccess(
  userId: string,
  pageIds: string[],
  grantedBy: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  // Step 1 — delete existing rows for this user
  const { error: deleteError } = await supabase
    .from("admin_page_access")
    .delete()
    .eq("admin_user_id", userId);

  if (deleteError)
    throw new Error(
      `Failed to clear page access for user ${userId}: ${deleteError.message}`
    );

  // Step 2 — insert new rows (skip if the list is empty)
  if (pageIds.length === 0) return;

  const rows = pageIds.map((pageId) => ({
    admin_user_id: userId,
    page_id: pageId,
    granted_by: grantedBy,
  }));

  const { error: insertError } = await supabase
    .from("admin_page_access")
    .insert(rows);

  if (insertError)
    throw new Error(
      `Failed to set page access for user ${userId}: ${insertError.message}`
    );
}

/**
 * Grants a single page to a user. Uses upsert so calling it twice is
 * idempotent (no duplicate-key error).
 */
export async function grantPageAccess(
  userId: string,
  pageId: string,
  grantedBy: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("admin_page_access")
    .upsert(
      { admin_user_id: userId, page_id: pageId, granted_by: grantedBy },
      { onConflict: "admin_user_id, page_id" }
    );

  if (error)
    throw new Error(
      `Failed to grant page ${pageId} to user ${userId}: ${error.message}`
    );
}

/**
 * Revokes a single page grant from a user.
 */
export async function revokePageAccess(
  userId: string,
  pageId: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("admin_page_access")
    .delete()
    .eq("admin_user_id", userId)
    .eq("page_id", pageId);

  if (error)
    throw new Error(
      `Failed to revoke page ${pageId} from user ${userId}: ${error.message}`
    );
}

// ---------------------------------------------------------------------------
// Role management
// ---------------------------------------------------------------------------

/**
 * Updates the role of an existing admin_user record.
 */
export async function updateAdminUserRole(
  userId: string,
  role: AdminRole
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("admin_users")
    .update({ role })
    .eq("id", userId);

  if (error)
    throw new Error(`Failed to update role for user ${userId}: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Invite
// ---------------------------------------------------------------------------

/**
 * Invites a new admin user via the Next.js API route `/api/admin/invite`.
 *
 * Supabase's `admin.inviteUserByEmail` requires the service-role key which
 * must never be exposed on the client. The API route handles the privileged
 * Supabase call server-side and creates the corresponding admin_users row.
 *
 * Throws if the server responds with a non-2xx status.
 */
export async function inviteAdminUser(
  email: string,
  role: AdminRole
): Promise<void> {
  const response = await fetch("/api/admin/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to invite admin user: ${body?.error ?? response.statusText}`
    );
  }
}
