/**
 * The four admin roles in the Kaushalya Genius Kid admin panel.
 *
 * super_admin — complete access to everything, including user management.
 * admin       — broad access; page grants configured by super_admin.
 * manager     — operational access; page grants configured by super_admin.
 * sales       — lead pipeline only; page grants configured by super_admin.
 */
export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'sales';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
  /** Populated when fetched with page access join. */
  page_access?: string[];
}

/** A page registered in the admin_pages table. */
export interface AdminPage {
  id: string;
  label: string;
  description: string;
  sort_order: number;
}

/** A single page grant row — one (user, page) pair. */
export interface AdminPageAccess {
  admin_user_id: string;
  page_id: string;
  granted_at: string;
  granted_by: string | null;
}

/** Shape of the current user's session with RBAC data attached. */
export interface AdminSessionWithAccess {
  id: string;
  email: string;
  role: AdminRole;
  isSuperAdmin: boolean;
  /** Set of page IDs this user can access. super_admin gets all pages. */
  accessiblePages: Set<string>;
}
