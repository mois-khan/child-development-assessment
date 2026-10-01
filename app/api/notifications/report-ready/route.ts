import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notifyUser } from "@/lib/notifications/send";
import { storeReportSnapshot } from "@/lib/storage/report-storage";

/**
 * Fired right after a parent (or school) finishes an assessment.
 *
 * Pipeline:
 *   1. Send push notification to the parent
 *   2. Generate PDF snapshot → upload to Cloudflare R2 → persist URL in DB
 *      (This freezes the report at the current design/logic — immutable forever)
 *   3. Email the PDF to the parent as a best-effort attachment
 */
export async function POST(request: Request) {
  try {
    const { assessmentId } = await request.json();
    if (!assessmentId) {
      return NextResponse.json({ error: "assessmentId required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, status, child_id, children(name, profile_id, parent_email)")
      .eq("id", assessmentId)
      .maybeSingle();

    const child = assessment?.children as unknown as {
      name: string;
      profile_id: string;
      parent_email?: string;
    } | null;

    if (!assessment || assessment.status !== "complete" || !child || child.profile_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── Step 1: Push notification ────────────────────────────────────────────
    await notifyUser({
      userId: user.id,
      type: "report_ready",
      title: `${child.name}'s report is ready`,
      body: "Tap to see their phase, their strengths and what to work on next.",
      url: `/children/${assessment.child_id}`,
    });

    // ── Step 2: Generate PDF → upload to R2 → persist URL ────────────────────
    // This freezes the report at the current design/logic/CMS. Future changes
    // to the codebase will NOT affect this stored report.
    const origin = new URL(request.url).origin;
    const hostname = new URL(request.url).hostname;
    const reportPageUrl = `${origin}/report/${assessmentId}`;

    const allCookies = cookieStore.getAll();
    const pptrCookies = allCookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: hostname,
      path: "/",
    }));

    let snapshotUrl: string | null = null;

    try {
      snapshotUrl = await storeReportSnapshot(assessmentId, reportPageUrl, pptrCookies);
      console.log(`[report-ready] Snapshot: ${snapshotUrl ?? "R2 not configured, skipped"}`);
    } catch (snapshotErr) {
      console.error("[report-ready] Snapshot failed (non-fatal):", snapshotErr);
    }

    // ── Step 3: Email the PDF (best-effort) ──────────────────────────────────
    const userEmail = user.email;
    const targetEmails = new Set<string>();
    if (userEmail) targetEmails.add(userEmail);
    if (child.parent_email) targetEmails.add(child.parent_email);

    if (targetEmails.size > 0 && process.env.SENDGRID_API_KEY) {
      try {
        console.log(`[report-ready] Generating PDF for email (${assessmentId})…`);
        const { generateReportPdf } = await import("@/lib/pdf/generate");
        const pdfBuffer = await generateReportPdf(reportPageUrl, pptrCookies as any);

        const { sendReportEmail } = await import("@/lib/email/send");
        await sendReportEmail({
          to: Array.from(targetEmails),
          childName: child.name,
          pdfBuffer,
        });
        console.log(`[report-ready] Email sent to: ${Array.from(targetEmails).join(", ")}`);
      } catch (emailErr) {
        console.error("[report-ready] Email failed (non-fatal):", emailErr);
      }
    } else {
      console.log(
        `[report-ready] Email skipped — emails: ${targetEmails.size}, SENDGRID configured: ${!!process.env.SENDGRID_API_KEY}`
      );
    }

    return NextResponse.json({ success: true, snapshotUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
