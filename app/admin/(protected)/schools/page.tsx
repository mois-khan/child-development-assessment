"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSchoolDetail, listSchools, inviteSchool, resetSchoolPassword, type AdminSchool } from "@/lib/data/schools";
import { exportAllSchools, exportSchoolRoster } from "@/lib/export/schools-xlsx";
import { Badge, Button, Card, IconClose, IconDownload, InlineBanner, useBanner } from "@/components/ui";

/**
 * A password the admin can read aloud or paste into WhatsApp without
 * ambiguity — no 0/O or 1/l/I, chunked like a product key so it's easy to
 * check character-by-character over a phone call. crypto.getRandomValues
 * (not Math.random) because this is a real account credential.
 */
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (n) => alphabet[n % alphabet.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

/** WhatsApp's brand mark — a filled logo, not a themed outline icon, so it
 * lives here rather than in the shared line-icon family (components/ui/icons.tsx). */
function IconWhatsApp({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5-.17-.01-.37-.01-.57-.01s-.52.07-.8.37c-.27.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.96 9.96 0 0 0 12.02 22C17.54 22 22 17.52 22 12S17.54 2 12.02 2zm0 18.2a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.2 8.2 0 1 1 6.93 3.84z" />
    </svg>
  );
}

/** wa.me needs digits-only, country code first; the app's own phone fields
 * are India numbers typed without one, so a bare 10-digit number gets +91. */
function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const banner = useBanner();

  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [inviting, setInviting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<
    { email: string; password: string; phone: string; schoolName: string } | null
  >(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

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
    setPassword("");
    setSchoolName("");
    setContactName("");
    setContactPhone("");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await inviteSchool({ email, password, schoolName, contactName, contactPhone });
      setCreatedCredentials({ email, password, phone: contactPhone, schoolName });
      resetForm();
      setInviteDrawerOpen(false);
      fetchData();
    } catch (err: any) {
      banner.showError("Failed to create school account: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleDownload = async (s: AdminSchool) => {
    setDownloadingId(s.id);
    try {
      const detail = await getSchoolDetail(s.id);
      if (!detail) throw new Error("School not found.");
      await exportSchoolRoster(detail);
    } catch (err: any) {
      banner.showError("Failed to download roster: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      await exportAllSchools(schools);
    } catch (err: any) {
      banner.showError("Failed to download rosters: " + err.message);
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleResend = async (s: AdminSchool) => {
    setResettingId(s.id);
    try {
      const newPassword = generatePassword();
      await resetSchoolPassword(s.id, newPassword);
      setCreatedCredentials({ email: s.email, password: newPassword, phone: s.contactPhone, schoolName: s.schoolName });
    } catch (err: any) {
      banner.showError("Failed to reset password: " + err.message);
    } finally {
      setResettingId(null);
    }
  };

  return (
    <>
      <InlineBanner message={banner.message} onDismiss={banner.clear} />

      {createdCredentials && (
        <Card variant="clay" className="mb-6 border-l-4 border-l-[var(--st-on-track)] !p-5">
          <p className="text-sm font-semibold text-ink">
            {createdCredentials.schoolName} is ready. This is the only time the password is shown &mdash; share it now.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm">
            <span><span className="text-ink-3">Email </span>{createdCredentials.email}</span>
            <span><span className="text-ink-3">Password </span>{createdCredentials.password}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {createdCredentials.phone && (
              <a
                href={`https://wa.me/${toWhatsAppDigits(createdCredentials.phone)}?text=${encodeURIComponent(
                  `Hi! Your ${createdCredentials.schoolName} login for Kaushalya Genius Kid Program is ready.\n\nSign in at: ${typeof window !== "undefined" ? window.location.origin : ""}/join\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nYou can change this password after signing in.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#25D366]/10 px-3 py-2 text-sm font-semibold text-[#128C4A] hover:bg-[#25D366]/20"
              >
                <IconWhatsApp size={16} /> Send on WhatsApp
              </a>
            )}
            <Button size="sm" variant="ghost" onClick={() => setCreatedCredentials(null)}>
              Done
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Schools</h1>
          <p className="mt-1 text-sm text-ink-3">
            One login, many students. Set up a school after the deal is closed and hand them
            the password yourself &mdash; they can change it later from their own page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={handleDownloadAll}
            disabled={downloadingAll || schools.length === 0}
            iconLeft={<IconDownload size={16} />}
          >
            {downloadingAll ? "Preparing…" : "Download all schools"}
          </Button>
          <Button onClick={() => setInviteDrawerOpen(true)} variant="primary">
            + Add School
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-ink-3">Loading schools...</p>
        ) : (
          <Card variant="clay" className="overflow-hidden">
            {/* ── table, md and up ── */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line-soft bg-surface-2 text-ink-3">
                  <tr>
                    <th className="px-6 py-3 font-semibold">School</th>
                    <th className="px-6 py-3 font-semibold">Contact</th>
                    <th className="px-6 py-3 font-semibold">Login email</th>
                    <th className="px-6 py-3 font-semibold">Students</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft bg-surface">
                  {schools.map((s) => (
                    <tr
                      key={s.id}
                      className="cursor-pointer hover:bg-surface-2/50"
                      onClick={() => router.push(`/admin/schools/${s.id}`)}
                    >
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Download this school's roster"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(s);
                            }}
                            disabled={downloadingId === s.id}
                            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-3 hover:bg-surface-2 hover:text-ink disabled:opacity-50"
                          >
                            <IconDownload size={13} />
                            {downloadingId === s.id ? "…" : "Download"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResend(s);
                            }}
                            disabled={resettingId === s.id}
                            className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-3 hover:bg-surface-2 hover:text-ink disabled:opacity-50"
                          >
                            {resettingId === s.id ? "Resetting…" : "Reset & resend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {schools.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-ink-3">
                        No schools yet. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── cards, below md ── */}
            <div className="divide-y divide-line-soft md:hidden">
              {schools.map((s) => (
                <div
                  key={s.id}
                  className="cursor-pointer p-5 active:bg-surface-2/50"
                  onClick={() => router.push(`/admin/schools/${s.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{s.schoolName}</p>
                      {s.city && <p className="text-xs text-ink-3">{s.city}</p>}
                    </div>
                    <Badge tone={s.studentCount > 0 ? "success" : "neutral"}>
                      {s.studentCount} {s.studentCount === 1 ? "student" : "students"}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-ink-2">
                      {s.contactName || "—"}
                      {s.contactPhone && <span className="text-ink-3"> · {s.contactPhone}</span>}
                    </p>
                    <p className="break-all font-mono text-xs text-ink-3">{s.email}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(s);
                      }}
                      disabled={downloadingId === s.id}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-3 hover:bg-surface-2 hover:text-ink disabled:opacity-50"
                    >
                      <IconDownload size={13} />
                      {downloadingId === s.id ? "…" : "Download"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResend(s);
                      }}
                      disabled={resettingId === s.id}
                      className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-3 hover:bg-surface-2 hover:text-ink disabled:opacity-50"
                    >
                      {resettingId === s.id ? "Resetting…" : "Reset & resend"}
                    </button>
                  </div>
                </div>
              ))}
              {schools.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-ink-3">
                  No schools yet. Add one to get started.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      {inviteDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !inviting && setInviteDrawerOpen(false)} />
          <div className="animate-rise relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-bold">Add School</h2>
              <button onClick={() => !inviting && setInviteDrawerOpen(false)} className="p-2 text-ink-3 hover:bg-surface-2 rounded-full">
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="flex-1 space-y-5 overflow-y-auto p-5">
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

              <div className="grid gap-5 sm:grid-cols-2">
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
                  <label className="block text-sm font-semibold text-ink-2 mb-1">WhatsApp / Contact Phone</label>
                  <input
                    type="tel"
                    className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="98765 43210"
                    disabled={inviting}
                  />
                  <p className="mt-1 text-xs text-ink-3">Used for the "Send on WhatsApp" button.</p>
                </div>
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
                <p className="mt-1 text-xs text-ink-3">What the school signs in with at /join.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-1">Password *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    minLength={8}
                    className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm font-mono"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={inviting}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPassword(generatePassword())}
                    disabled={inviting}
                  >
                    Generate
                  </Button>
                </div>
                <p className="mt-1 text-xs text-ink-3">
                  You&rsquo;ll see this once more after creating the account, to hand to the school yourself.
                </p>
              </div>

              <div className="pt-6 mt-auto border-t border-line flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setInviteDrawerOpen(false)} disabled={inviting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={inviting}>
                  {inviting ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
