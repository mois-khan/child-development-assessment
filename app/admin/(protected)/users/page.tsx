"use client";

import { useEffect, useState } from "react";
import { AdminUser, AdminPage, AdminRole } from "@/lib/types/rbac";
import { 
  listAdminUsers, 
  listAdminPages, 
  setPageAccess, 
  updateAdminUserRole, 
  inviteAdminUser 
} from "@/lib/data/rbac";
import { Card, Button, Badge, IconClose } from "@/components/ui";

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit User Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>("sales");
  const [userPageAccess, setUserPageAccess] = useState<Set<string>>(new Set());
  const [savingEdit, setSavingEdit] = useState(false);

  // Invite Drawer State
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("sales");
  const [inviting, setInviting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([listAdminUsers(), listAdminPages()]);
      setUsers(u);
      setPages(p);
    } catch (err: any) {
      alert("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditDrawer = (user: AdminUser) => {
    setEditingUser(user);
    setEditRole(user.role);
    setUserPageAccess(new Set(user.page_access || []));
    setEditDrawerOpen(true);
  };

  const togglePageAccess = (pageId: string) => {
    const newAccess = new Set(userPageAccess);
    if (newAccess.has(pageId)) {
      newAccess.delete(pageId);
    } else {
      newAccess.add(pageId);
    }
    setUserPageAccess(newAccess);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    
    try {
      if (editingUser.role !== editRole) {
        await updateAdminUserRole(editingUser.id, editRole);
      }
      // Super admins don't need explicit page access grants
      if (editRole !== "super_admin") {
        await setPageAccess(editingUser.id, Array.from(userPageAccess), "current_user_id"); 
        // Note: the backend actually determines the granted_by from auth.uid() automatically in the trigger or RLS if we set it up, or we can omit. The data function might just not send it.
      }
      
      setEditDrawerOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Failed to save user: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await inviteAdminUser(inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteDrawerOpen(false);
      fetchData();
      alert("Invite sent successfully!");
    } catch (err: any) {
      alert("Failed to send invite: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadgeTone = (role: AdminRole): "accent" | "success" | "warn" | "neutral" => {
    switch(role) {
      case "super_admin": return "accent";
      case "admin": return "accent";
      case "manager": return "success";
      case "sales": return "warn";
      default: return "neutral";
    }
  };

  const formatRole = (role: AdminRole) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-ink-3">
            Control which team members can access which admin pages. Only accessible to super admins.
          </p>
        </div>
        <Button onClick={() => setInviteDrawerOpen(true)} variant="primary">
          + Invite User
        </Button>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-ink-3">Loading users...</p>
        ) : (
          <Card variant="clay" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line-soft bg-surface-2 text-ink-3">
                  <tr>
                    <th className="px-6 py-3 font-semibold">User</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                    <th className="px-6 py-3 font-semibold">Access</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft bg-surface">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-surface-2/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={getRoleBadgeTone(user.role)}>{formatRole(user.role)}</Badge>
                      </td>
                      <td className="px-6 py-4 text-ink-3">
                        {user.role === "super_admin" 
                          ? "All pages" 
                          : `${(user.page_access || []).length} / ${pages.length} pages`}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEditDrawer(user)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-ink-3">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Drawer */}
      {editDrawerOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !savingEdit && setEditDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] shadow-2xl flex flex-col animate-slide-in-right h-full overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-bold">Edit User Access</h2>
              <button onClick={() => !savingEdit && setEditDrawerOpen(false)} className="p-2 text-ink-3 hover:bg-surface-2 rounded-full">
                <IconClose size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-6 flex-1">
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Email</label>
                <div className="rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink font-mono">
                  {editingUser.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Role</label>
                <select 
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as AdminRole)}
                  disabled={savingEdit}
                >
                  <option value="super_admin">Super Admin (All access)</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="sales">Sales</option>
                </select>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-extrabold tracking-widest uppercase text-ink-3 mb-4">Page Access</h3>
                
                {editRole === "super_admin" ? (
                  <div className="rounded-md bg-surface-2 p-4 text-sm text-ink-2 text-center border border-line-soft">
                    Super admins always have access to all pages.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pages.map(page => {
                      const checked = userPageAccess.has(page.id);
                      return (
                        <div key={page.id} className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-ink">{page.label}</div>
                            <div className="text-xs text-ink-3">{page.description}</div>
                          </div>
                          <button 
                            type="button"
                            role="switch" 
                            aria-checked={checked}
                            onClick={() => togglePageAccess(page.id)}
                            disabled={savingEdit}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--surface-3)]'} ${savingEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-line flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => setEditDrawerOpen(false)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Drawer */}
      {inviteDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !inviting && setInviteDrawerOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--surface)] shadow-2xl flex flex-col animate-slide-in-right h-full">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-bold">Invite User</h2>
              <button onClick={() => !inviting && setInviteDrawerOpen(false)} className="p-2 text-ink-3 hover:bg-surface-2 rounded-full">
                <IconClose size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-5 space-y-5 flex-1">
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  disabled={inviting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Role *</label>
                <select 
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as AdminRole)}
                  disabled={inviting}
                >
                  <option value="sales">Sales</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="mt-1 text-xs text-ink-3">Page access can be configured after the invite is sent.</p>
              </div>

              <div className="pt-6 mt-auto border-t border-line flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setInviteDrawerOpen(false)} disabled={inviting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={inviting}>
                  {inviting ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
