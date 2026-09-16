"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  IconCalendar,
  IconLock,
  IconMail,
  IconPhone,
  IconSchool,
  IconUser,
} from "@/components/ui";

/* ── what this page owns ─────────────────────────────────────────────────────
 * Identity and credentials: name, phone, email, password. Nothing about
 * children, reports, or payments — those are somewhere else on purpose.
 * ────────────────────────────────────────────────────────────────────────── */

export default function AccountSettingsPage() {
  const { user, profile, refreshProfile, updatePassword } = useAuth();
  const isSchool = profile?.accountType === "school";

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  // School-only fields — the schools table extends profiles with these
  // (see 0007_schools.sql), so a school edits a different row underneath
  // the same "Edit details" form a parent uses.
  const [editSchoolName, setEditSchoolName] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (profile) {
      setEditName(profile.fullName || "");
      setEditPhone(profile.phone || "");
      setEditEmail(profile.email || "");
      setEditSchoolName(profile.school?.name || "");
      setEditContactName(profile.school?.contactName || "");
      setEditContactPhone(profile.school?.contactPhone || "");
      setEditCity(profile.school?.city || "");
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (isSchool) {
        const { error } = await supabase
          .from("schools")
          .update({
            school_name: editSchoolName.trim(),
            contact_name: editContactName.trim(),
            contact_phone: editContactPhone.trim(),
            city: editCity.trim(),
          })
          .eq("id", user.id);
        if (error) throw error;

        await refreshProfile();
        setEditing(false);
        setProfileMsg("School details updated successfully!");
        setTimeout(() => setProfileMsg(null), 3000);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;

      /* Email is the login identity, so it is changed through auth, not by
         writing to profiles — Supabase mails a confirmation link to the old
         and new address and only then updates auth.users. A trigger
         (migration 0005) copies it into profiles at that point, which is why
         nothing here writes profiles.email itself. */
      const nextEmail = editEmail.trim();
      const emailChanged =
        nextEmail !== "" &&
        nextEmail.toLowerCase() !== (profile?.email || "").trim().toLowerCase();

      if (emailChanged) {
        const { error: emailError } = await supabase.auth.updateUser({ email: nextEmail });
        if (emailError) throw emailError;
      }

      await refreshProfile();
      setEditing(false);
      setProfileMsg(
        emailChanged
          ? `Saved. Open the confirmation link we sent to ${nextEmail} to finish changing your email.`
          : "Profile updated successfully!",
      );
      setTimeout(() => setProfileMsg(null), emailChanged ? 8000 : 3000);
    } catch (err: any) {
      setProfileMsg(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ text: "Password must be at least 8 characters.", ok: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "Passwords don't match.", ok: false });
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    setChangingPassword(false);
    if (error) {
      setPasswordMsg({ text: error, ok: false });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMsg({ text: "Password updated.", ok: true });
    setTimeout(() => {
      setPasswordFormOpen(false);
      setPasswordMsg(null);
    }, 1500);
  }

  const parentName = isSchool
    ? profile?.school?.name || "Your school"
    : profile?.fullName || user?.user_metadata?.full_name || "Parent";
  const parentEmail = profile?.email || user?.email || "";
  const parentPhone = isSchool
    ? profile?.school?.contactPhone || ""
    : profile?.phone || user?.user_metadata?.phone || "";
  const joinedDate = profile?.createdAt ? formatDate(profile.createdAt) : "Recently";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2>{isSchool ? "School details" : "Your details"}</h2>
        <Button variant={editing ? "ghost" : "secondary"} size="sm" onClick={() => setEditing(!editing)}>
          {editing ? "Cancel" : "Edit details"}
        </Button>
      </div>

      {profileMsg && (
        <div
          role="alert"
          className="rounded-[var(--radius)] px-4 py-3 text-sm font-semibold"
          style={{
            background: profileMsg.includes("success")
              ? "var(--st-on-track-soft)"
              : "var(--st-consult-soft)",
            color: profileMsg.includes("success") ? "var(--st-on-track)" : "var(--st-consult)",
          }}
        >
          {profileMsg}
        </div>
      )}

      <Card variant="clay" className="p-6 sm:p-7">
        {editing ? (
          <form onSubmit={handleSaveProfile} className="max-w-lg space-y-4">
            {isSchool ? (
              <>
                <div>
                  <label className="label" htmlFor="edit-school-name">School Name</label>
                  <input
                    id="edit-school-name"
                    className="field"
                    value={editSchoolName}
                    onChange={(e) => setEditSchoolName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="edit-contact-name">Contact Person</label>
                  <input
                    id="edit-contact-name"
                    className="field"
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                    placeholder="Priya Sharma"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="edit-contact-phone">Contact Phone</label>
                  <input
                    id="edit-contact-phone"
                    type="tel"
                    className="field"
                    value={editContactPhone}
                    onChange={(e) => setEditContactPhone(e.target.value)}
                    placeholder="98765 43210"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="edit-city">City</label>
                  <input
                    id="edit-city"
                    className="field"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Bengaluru"
                  />
                </div>
                <p className="hint">
                  The login email ({parentEmail || "—"}) can&rsquo;t be changed here — contact
                  support if it needs to change.
                </p>
              </>
            ) : (
              <>
                <div>
                  <label className="label" htmlFor="edit-name">Full Name</label>
                  <input
                    id="edit-name"
                    className="field"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="edit-phone">Mobile Number</label>
                  <input
                    id="edit-phone"
                    type="tel"
                    className="field"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="98765 43210"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    className="field"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="priya@example.com"
                    autoComplete="email"
                  />
                  <p className="hint">
                    {editEmail.trim().toLowerCase() !== (profile?.email || "").trim().toLowerCase()
                      ? "You'll get a confirmation link at both your old and new address. The change applies once you open it."
                      : "This is the address you sign in with."}
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setEditName(profile?.fullName || "");
                  setEditPhone(profile?.phone || "");
                  setEditEmail(profile?.email || "");
                  setEditSchoolName(profile?.school?.name || "");
                  setEditContactName(profile?.school?.contactName || "");
                  setEditContactPhone(profile?.school?.contactPhone || "");
                  setEditCity(profile?.school?.city || "");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : isSchool ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailTile label="School name" value={parentName} icon={<IconSchool size={17} />} color="var(--brand-500)" />
            <DetailTile
              label="Contact person"
              value={profile?.school?.contactName || "Not provided"}
              muted={!profile?.school?.contactName}
              icon={<IconUser size={17} />}
              color="var(--sec-auditory)"
            />
            <DetailTile label="Login email" value={parentEmail || "—"} icon={<IconMail size={17} />} color="var(--sec-language)" />
            <DetailTile
              label="Contact phone"
              value={parentPhone || "Not provided"}
              muted={!parentPhone}
              icon={<IconPhone size={17} />}
              color="var(--sun-500)"
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailTile label="Parent name" value={parentName} icon={<IconUser size={17} />} color="var(--brand-500)" />
            <DetailTile label="Email address" value={parentEmail || "—"} icon={<IconMail size={17} />} color="var(--sec-auditory)" />
            <DetailTile
              label="Mobile phone"
              value={parentPhone || "Not provided"}
              muted={!parentPhone}
              icon={<IconPhone size={17} />}
              color="var(--sec-language)"
            />
            <DetailTile label="Member since" value={joinedDate} icon={<IconCalendar size={17} />} color="var(--sun-500)" />
          </div>
        )}
      </Card>

      <Card variant="clay" className="!p-5">
        <button
          type="button"
          onClick={() => setPasswordFormOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold text-ink">
            <IconLock size={17} className="text-ink-3" /> Change password
          </span>
          <span className="text-xs font-semibold text-accent">{passwordFormOpen ? "Cancel" : "Change"}</span>
        </button>

        {passwordFormOpen && (
          <form onSubmit={handleChangePassword} className="animate-rise mt-4 max-w-sm space-y-3 border-t border-line-soft pt-4">
            <div>
              <label className="label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                className="field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={changingPassword}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                className="field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={changingPassword}
                autoComplete="new-password"
              />
            </div>
            {passwordMsg && (
              <p className={`text-sm font-semibold ${passwordMsg.ok ? "text-[var(--st-on-track)]" : "text-[var(--st-consult)]"}`}>
                {passwordMsg.text}
              </p>
            )}
            <Button type="submit" size="sm" disabled={changingPassword}>
              {changingPassword ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

function DetailTile({
  label,
  value,
  icon,
  color,
  muted = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  muted?: boolean;
}) {
  return (
    <div
      className="rounded-[var(--radius)] border border-line p-4"
      style={{ background: `color-mix(in srgb, ${color} 6%, var(--surface))` }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)]"
          style={{ color, background: `color-mix(in srgb, ${color} 14%, var(--surface))` }}
        >
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-ink-3">{label}</p>
      </div>
      <p className={`mt-2.5 truncate text-base font-bold ${muted ? "text-ink-3" : "text-ink"}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
