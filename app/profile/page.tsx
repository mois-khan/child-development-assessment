"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listChildren, type SavedChild } from "@/lib/store";
import { summariseAge, todayISO } from "@/lib/age";
import { stageForAge } from "@/lib/stage";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  Footer,
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconPlus,
  IconRefresh,
  IconShield,
  IconSparkle,
  IconStarFilled,
  Mascot,
  Section,
  Shell,
  TopBar,
} from "@/components/ui";

interface AssessmentRow {
  id: string;
  childId: string;
  childName: string;
  childPhotoUrl?: string;
  childDob: string;
  assessedOn: string;
  createdAt: string;
  completedAt?: string;
  startStage?: string;
  status: string;
}

interface PaymentRecord {
  id: string;
  amountPaise: number;
  status: string;
  razorpayPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
  notes: Record<string, any>;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileInner />
    </Suspense>
  );
}

function ProfileInner() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [children, setChildren] = useState<SavedChild[] | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRow[] | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Edit details state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!authLoading && user === null) {
      router.replace("/join?next=/profile");
    }
  }, [authLoading, user, router]);

  // Load parent data
  useEffect(() => {
    if (!user) return;

    let active = true;

    async function loadData() {
      setLoadingData(true);
      try {
        const supabase = getSupabaseBrowserClient();

        // 1. Children
        const kids = await listChildren();
        if (!active) return;
        setChildren(kids);

        // 2. Assessments across parent's children
        const { data: aData, error: aErr } = await supabase
          .from("assessments")
          .select("id, child_id, assessed_on, created_at, completed_at, start_stage, status, children(id, name, photo_url, dob)")
          .order("created_at", { ascending: false });

        if (!active) return;

        if (!aErr && aData) {
          const rows: AssessmentRow[] = aData.map((item: any) => {
            const childInfo = Array.isArray(item.children) ? item.children[0] : item.children;
            return {
              id: item.id,
              childId: item.child_id,
              childName: childInfo?.name || "Child",
              childPhotoUrl: childInfo?.photo_url || undefined,
              childDob: childInfo?.dob || "",
              assessedOn: item.assessed_on,
              createdAt: item.created_at,
              completedAt: item.completed_at || undefined,
              startStage: item.start_stage,
              status: item.status,
            };
          });
          setAssessments(rows);
        } else {
          setAssessments([]);
        }

        // 3. Payments / Purchases
        const { data: pData, error: pErr } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });

        if (!active) return;

        if (!pErr && pData) {
          const mappedPayments: PaymentRecord[] = pData.map((p: any) => ({
            id: p.id,
            amountPaise: p.amount_paise,
            status: p.status,
            razorpayPaymentId: p.razorpay_payment_id,
            createdAt: p.created_at,
            paidAt: p.paid_at,
            notes: p.notes || {},
          }));
          setPayments(mappedPayments);
        } else {
          setPayments([]);
        }
      } catch (e) {
        console.error("Error loading profile data:", e);
      } finally {
        if (active) setLoadingData(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [user]);

  // Sync edit form fields when profile is available
  useEffect(() => {
    if (profile) {
      setEditName(profile.fullName || "");
      setEditPhone(profile.phone || "");
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      setEditing(false);
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  const today = todayISO();
  const completedAssessmentsCount = useMemo(() => {
    return assessments?.filter((a) => a.completedAt).length ?? 0;
  }, [assessments]);

  if (authLoading || (!user && !profile)) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center font-semibold text-ink-3">Loading profile…</p>
        </Shell>
      </>
    );
  }

  const parentName = profile?.fullName || user?.user_metadata?.full_name || "Parent";
  const parentEmail = profile?.email || user?.email || "";
  const parentPhone = profile?.phone || user?.user_metadata?.phone || "";
  const joinedDate = profile?.createdAt ? formatDate(profile.createdAt) : "Recently";

  return (
    <>
      <TopBar />

      <main className="pb-16">
        {/* ══ Hero Header ════════════════════════════════════════════════ */}
        <Shell width="wide">
          <div
            className="relative mt-7 overflow-hidden px-6 py-8 sm:px-10 sm:py-10"
            style={{
              borderRadius: "var(--radius-xl)",
              background: "linear-gradient(150deg, var(--brand-600), var(--brand-800))",
              boxShadow:
                "0 2px 5px rgba(69, 77, 93, 0.14), 0 40px 70px -28px color-mix(in srgb, var(--brand-600) 60%, transparent)",
            }}
          >
            <span
              aria-hidden="true"
              className="bloom"
              style={
                {
                  width: 320,
                  height: 320,
                  top: -140,
                  right: "6%",
                  "--bloom-color": "var(--sun-400)",
                  opacity: 0.28,
                } as React.CSSProperties
              }
            />

            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar name={parentName} size={84} ring />
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      <IconShield size={13} /> Parent Account
                    </span>
                  </div>
                  <h1 className="mt-2 text-white">{parentName}</h1>
                  <p className="mt-1 text-sm font-semibold text-white/80">
                    {parentEmail} {parentPhone ? `· ${parentPhone}` : ""}
                  </p>
                </div>
              </div>

              {/* Stats pill cards */}
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[94px] rounded-[var(--radius)] bg-white/12 px-4 py-3 text-center backdrop-blur">
                  <p
                    className="tnum text-2xl font-extrabold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {children ? children.length : "—"}
                  </p>
                  <p className="text-xs font-bold text-white/70">
                    {children?.length === 1 ? "Child" : "Children"}
                  </p>
                </div>

                <div className="min-w-[94px] rounded-[var(--radius)] bg-white/12 px-4 py-3 text-center backdrop-blur">
                  <p
                    className="tnum text-2xl font-extrabold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {assessments ? assessments.length : "—"}
                  </p>
                  <p className="text-xs font-bold text-white/70">
                    {assessments?.length === 1 ? "Assessment" : "Assessments"}
                  </p>
                </div>

                <div className="min-w-[94px] rounded-[var(--radius)] bg-white/12 px-4 py-3 text-center backdrop-blur">
                  <p
                    className="tnum text-2xl font-extrabold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {completedAssessmentsCount}
                  </p>
                  <p className="text-xs font-bold text-white/70">
                    {completedAssessmentsCount === 1 ? "Report" : "Reports"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Shell>

        {/* ══ Parent Details Card ════════════════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-accent">Account Details</p>
                <h2 className="mt-1">Parent profile</h2>
              </div>
              <Button
                variant={editing ? "ghost" : "secondary"}
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Cancel" : "Edit details"}
              </Button>
            </div>

            {profileMsg && (
              <div
                role="alert"
                className="mt-4 rounded-[var(--radius)] px-4 py-3 text-sm font-semibold"
                style={{
                  background: profileMsg.includes("success")
                    ? "var(--st-on-track-soft)"
                    : "var(--st-consult-soft)",
                  color: profileMsg.includes("success")
                    ? "var(--st-on-track)"
                    : "var(--st-consult)",
                }}
              >
                {profileMsg}
              </div>
            )}

            <Card variant="clay" className="mt-5 p-6 sm:p-7">
              {editing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="label" htmlFor="edit-name">
                      Full Name
                    </label>
                    <input
                      id="edit-name"
                      className="field"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="edit-phone">
                      Mobile Number
                    </label>
                    <input
                      id="edit-phone"
                      type="tel"
                      className="field"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="98765 43210"
                    />
                  </div>
                  <div className="pt-2 flex items-center gap-3">
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
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                      Parent Name
                    </p>
                    <p className="mt-1 text-base font-bold text-ink">{parentName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                      Email Address
                    </p>
                    <p className="mt-1 text-base font-bold text-ink">{parentEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                      Mobile Phone
                    </p>
                    <p className="mt-1 text-base font-bold text-ink">{parentPhone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                      Member Since
                    </p>
                    <p className="mt-1 text-base font-bold text-ink">{joinedDate}</p>
                  </div>
                </div>
              )}
            </Card>
          </Shell>
        </Section>

        {/* ══ Children Section ═══════════════════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-accent">Your Family</p>
                <h2 className="mt-1">Your children</h2>
              </div>
              <ButtonLink href="/children" size="sm" iconLeft={<IconPlus size={16} />}>
                Add a child
              </ButtonLink>
            </div>

            {loadingData && children === null ? (
              <p className="mt-6 text-ink-3 font-semibold">Loading children…</p>
            ) : children && children.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((child) => {
                  const age = summariseAge(child.dob, today, child.gestationalWeeks);
                  const stage = stageForAge(age.assessedMonths);
                  const childChecks = assessments?.filter((a) => a.childId === child.id) ?? [];
                  const completedChecks = childChecks.filter((a) => a.completedAt).length;

                  return (
                    <Card key={child.id} variant="clay" className="lift p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-4">
                          <Avatar name={child.name} photoUrl={child.photoUrl} size={64} ring />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-extrabold text-ink">
                              {child.name}
                            </h3>
                            {/* Display DOB with age in months in brackets */}
                            <p className="mt-1 text-sm font-semibold text-ink-2">
                              Born {formatDate(child.dob)} ({age.chronologicalMonths} month{age.chronologicalMonths === 1 ? "" : "s"})
                            </p>
                            <p className="text-xs font-semibold text-ink-3">
                              {child.gender === "girl" ? "Girl" : child.gender === "boy" ? "Boy" : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Badge tone="accent">
                            Stage {stage.roman} · {stage.name}
                          </Badge>
                          <Badge tone={completedChecks > 0 ? "success" : "neutral"}>
                            {completedChecks > 0
                              ? `${completedChecks} report${completedChecks === 1 ? "" : "s"}`
                              : "No reports yet"}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-line-soft flex items-center gap-2.5">
                        <ButtonLink href={`/children/${child.id}`} size="sm" variant="secondary" block>
                          View Profile
                        </ButtonLink>
                        <ButtonLink href={`/children/${child.id}/pay`} size="sm" block>
                          New Check
                        </ButtonLink>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card variant="clay" className="mt-6 p-8 text-center sm:p-12">
                <Mascot size={80} mood="wave" className="mx-auto" />
                <h3 className="mt-5 text-xl">No children added yet</h3>
                <p className="mx-auto mt-2 max-w-[40ch] text-base leading-relaxed text-ink-2">
                  Add your child&rsquo;s details to start tracking their developmental milestones and unlock stage-based reports.
                </p>
                <ButtonLink href="/children" size="lg" className="mt-6" iconLeft={<IconPlus size={18} />}>
                  Add your first child
                </ButtonLink>
              </Card>
            )}
          </Shell>
        </Section>

        {/* ══ Assessments Done (Tabular Format) ══════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-accent">History</p>
                <h2 className="mt-1">Assessments done</h2>
              </div>
              {children && children.length > 0 && (
                <ButtonLink
                  href={`/children/${children[0].id}/pay`}
                  size="sm"
                  iconRight={<IconArrowRight size={16} />}
                >
                  Start an assessment
                </ButtonLink>
              )}
            </div>

            {loadingData && assessments === null ? (
              <p className="mt-6 text-ink-3 font-semibold">Loading assessments…</p>
            ) : assessments && assessments.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-line bg-[var(--surface)] shadow-[var(--clay-sm)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-[var(--surface-2)]">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink-3">
                          Child
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink-3">
                          Assessment Name
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink-3">
                          Date &amp; Time
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink-3">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-ink-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {assessments.map((a) => (
                        <tr key={a.id} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/children/${a.childId}`}
                              className="flex items-center gap-3 group"
                            >
                              <Avatar name={a.childName} photoUrl={a.childPhotoUrl} size={36} />
                              <span className="font-extrabold text-ink group-hover:text-accent transition-colors">
                                {a.childName}
                              </span>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-ink text-sm">
                              Genius Milestone Check
                            </p>
                            <p className="text-xs text-ink-3">
                              6 developmental areas
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-ink-2 whitespace-nowrap">
                            {formatDateTime(a.completedAt || a.createdAt || a.assessedOn)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge tone={a.completedAt ? "success" : "sun"}>
                              {a.completedAt ? "Completed" : "In progress"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2.5">
                              {a.completedAt ? (
                                <>
                                  <ButtonLink href={`/report/${a.id}`} variant="secondary" size="sm">
                                    View Report
                                  </ButtonLink>
                                  <ButtonLink
                                    href={`/report/${a.id}?download=1`}
                                    size="sm"
                                    iconLeft={<IconDownload size={15} />}
                                  >
                                    Download Report
                                  </ButtonLink>
                                </>
                              ) : (
                                <ButtonLink href={`/assessment/${a.id}`} size="sm">
                                  Resume Check
                                </ButtonLink>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Card variant="clay" className="mt-6 p-8 text-center sm:p-10">
                <p className="text-ink-2 font-medium">
                  No assessments have been taken yet for your children.
                </p>
                {children && children.length > 0 && (
                  <ButtonLink
                    href={`/children/${children[0].id}/pay`}
                    size="md"
                    className="mt-4"
                    iconRight={<IconArrowRight size={17} />}
                  >
                    Start check for {children[0].name}
                  </ButtonLink>
                )}
              </Card>
            )}
          </Shell>
        </Section>

        {/* ══ Courses & Programs Section ═════════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div>
              <p className="eyebrow eyebrow-accent">Learning &amp; Growth</p>
              <h2 className="mt-1">Courses and programmes</h2>
              <p className="lede mt-2 max-w-[50ch]">
                Milestone-tailored curricula and home activity plans built around the Kaushalya Genius Kid Method.
              </p>
            </div>

            {/* Enrolled / Purchased passes */}
            {payments && payments.filter((p) => p.status === "paid").length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg">Your enrolled purchases</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {payments
                    .filter((p) => p.status === "paid")
                    .map((p) => (
                      <Card key={p.id} variant="clay" className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-extrabold text-ink text-base">
                            Genius Milestone Assessment Access
                          </span>
                          <Badge tone="success">Active</Badge>
                        </div>
                        <p className="mt-1.5 text-sm text-ink-3">
                          Paid {formatRupees(p.amountPaise)} on {formatDateTime(p.paidAt || p.createdAt)}
                        </p>
                        {p.razorpayPaymentId && (
                          <p className="mt-0.5 font-mono text-xs text-ink-3">
                            Ref: {p.razorpayPaymentId}
                          </p>
                        )}
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Recommended KGKP Programs */}
            <div className="mt-10">
              <h3 className="text-lg">Recommended programmes for your family</h3>

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {COURSES.map((course) => (
                  <Card key={course.title} variant="clay" className="lift flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{
                            background: course.accentBg,
                            color: course.accentColor,
                          }}
                        >
                          <IconSparkle size={12} /> {course.stageLabel}
                        </span>
                        <span className="text-xs font-bold text-ink-3">
                          {course.ageRange}
                        </span>
                      </div>

                      <h4 className="mt-3 text-lg font-extrabold text-ink">
                        {course.title}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-ink-2">
                        {course.description}
                      </p>

                      <ul className="mt-4 list-none space-y-2 p-0">
                        {course.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-sm font-semibold text-ink-2">
                            <IconCheck size={14} className="text-[var(--st-on-track)] shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-line-soft flex flex-col gap-2.5">
                      <a
                        href={course.href}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm w-full justify-center"
                      >
                        Explore Program
                      </a>
                      <a
                        href="https://wa.me/919394360043?text=Hello%20Kaushalya%20Team%2C%20I%20would%20like%20to%20know%20more%20about%20the%20Genius%20Kid%20Programs"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm w-full justify-center text-[var(--st-on-track-ink)]"
                      >
                        Talk to Counselor
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}

const COURSES = [
  {
    title: "0–6 Years Early Brain Development",
    stageLabel: "Comprehensive",
    ageRange: "0–6 Years",
    accentBg: "var(--accent-soft)",
    accentColor: "var(--accent)",
    description:
      "The flagship Kaushalya method covering all seven brain developmental stages and six competences: visual, auditory, tactile, mobility, language, and manual.",
    highlights: [
      "10 min daily guided video lessons",
      "30 min sensory & motor play kits",
      "Comprehensive weekly milestone checklists",
    ],
    href: "https://www.kaushalyageniuskid.com",
  },
  {
    title: "Stage-Specific Acceleration Kits",
    stageLabel: "Phase I–VI",
    ageRange: "Newborn to Toddler",
    accentBg: "var(--sun-100)",
    accentColor: "var(--sun-700)",
    description:
      "Targeted neurological stimulation for Medulla, Pons, Mid-Brain, and Cortex stages to maximize neural connectivity during critical sensitive periods.",
    highlights: [
      "Day-wise activity plans",
      "Flashcards & sensory stimulation guides",
      "One-on-one specialist milestone reviews",
    ],
    href: "https://www.kaushalyageniuskid.com",
  },
  {
    title: "Encyclopaedic Knowledge & Memory",
    stageLabel: "Early Literacy",
    ageRange: "1–6 Years",
    accentBg: "var(--st-on-track-soft)",
    accentColor: "var(--st-on-track)",
    description:
      "Structured flashcards and bit-of-intelligence method to cultivate photographic memory, vocabulary, and early curiosity across science and nature.",
    highlights: [
      "Daily flashcard schedules",
      "Visual & auditory mastery exercises",
      "Parenting webinar access",
    ],
    href: "https://www.kaushalyageniuskid.com",
  },
];

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(isoOrDate?: string | null): string {
  if (!isoOrDate) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) {
    return new Date(`${isoOrDate}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
