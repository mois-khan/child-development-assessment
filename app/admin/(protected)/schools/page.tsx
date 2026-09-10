"use client";

import { useEffect, useState } from "react";
import { listSchools, inviteSchool, type AdminSchool } from "@/lib/data/schools";
import { Badge, Button, Card, IconClose, InlineBanner, useBanner } from "@/components/ui";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const banner = useBanner();

  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setSchools(await listSchools());
    } catch (err: any) {
      banner.showError("Failed to load schools: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEmail("");
    setSchoolName("");
    setContactName("");
    setContactPhone("");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await inviteSchool({ email, schoolName, contactName, contactPhone });
      resetForm();
      setInviteDrawerOpen(false);
      fetchData();
      banner.showSuccess(`Invite sent to ${email}.`);
    } catch (err: any) {
      banner.showError("Failed to send invite: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <InlineBanner message={banner.message} onDismiss={banner.clear} />
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Schools</h1>
          <p className="mt-1 text-sm text-ink-3">
            One login, many students. Invite a school after the deal is closed — they set
            their own password and see every student they add.
          </p>
        </div>
        <Button onClick={() => setInviteDrawerOpen(true)} variant="primary">
          + Invite School
        </Button>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-ink-3">Loading schools...</p>
        ) : (
          <Card variant="clay" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line-soft bg-surface-2 text-ink-3">
                  <tr>
                    <th className="px-6 py-3 font-semibold">School</th>
                    <th className="px-6 py-3 font-semibold">Contact</th>
                    <th className="px-6 py-3 font-semibold">Login email</th>
                    <th className="px-6 py-3 font-semibold">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft bg-surface">
                  {schools.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-2/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink">{s.schoolName}</div>
                        {s.city && <div className="text-xs text-ink-3">{s.city}</div>}
                      </td>
                      <td className="px-6 py-4 text-ink-2">
                        {s.contactName || "—"}
                        {s.contactPhone && (
                          <div className="text-xs text-ink-3">{s.contactPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-ink-3">{s.email}</td>
                      <td className="px-6 py-4">
                        <Badge tone={s.studentCount > 0 ? "success" : "neutral"}>
                          {s.studentCount} {s.studentCount === 1 ? "student" : "students"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {schools.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-ink-3">
                        No schools yet. Invite one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {inviteDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !inviting && setInviteDrawerOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--surface)] shadow-2xl flex flex-col animate-slide-in-right h-full">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-bold">Invite School</h2>
              <button onClick={() => !inviting && setInviteDrawerOpen(false)} className="p-2 text-ink-3 hover:bg-surface-2 rounded-full">
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-5 space-y-5 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">School Name *</label>
                <input
                  required
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Little Sprouts Preschool"
                  disabled={inviting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Login Email *</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@littlesprouts.example"
                  disabled={inviting}
                />
                <p className="mt-1 text-xs text-ink-3">Where the invite to set a password is sent.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Contact Person</label>
                <input
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Priya Sharma"
                  disabled={inviting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="98765 43210"
                  disabled={inviting}
                />
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
