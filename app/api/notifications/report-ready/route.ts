import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notifyUser } from "@/lib/notifications/send";

/**
 * Fired right after a parent (or school) finishes an assessment
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

    const child = assessment?.children as unknown as { name: string; profile_id: string; parent_email?: string } | null;
    if (!assessment || assessment.status !== "complete" || !child || child.profile_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await notifyUser({
      userId: user.id,
      type: "report_ready",
      title: `${child.name}'s report is ready`,
      body: "Tap to see their phase, their strengths and what to work on next.",
      url: `/children/${assessment.child_id}`,
    });

    // Generate and send PDF report via email
    // The client calls this route as a fire-and-forget so we can safely await this
    const origin = new URL(request.url).origin;
    const hostname = new URL(request.url).hostname;
    
    // Extract cookies for puppeteer
    const allCookies = cookieStore.getAll();
    const pptrCookies = allCookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: hostname,
      path: '/'
    }));

    const userEmail = user.email;
    const targetEmails = new Set<string>();
    if (userEmail) targetEmails.add(userEmail);
    if (child.parent_email) targetEmails.add(child.parent_email);

    if (targetEmails.size > 0 && process.env.SENDGRID_API_KEY) {
      try {
        console.log(`Starting PDF generation for assessment ${assessmentId}...`);
        const { generateReportPdf } = await import("@/lib/pdf/generate");
        const reportUrl = `${origin}/report/${assessmentId}`;
        
        const pdfBuffer = await generateReportPdf(reportUrl, pptrCookies as any);
        console.log(`PDF generated successfully, sending email...`);
        
        const { sendReportEmail } = await import("@/lib/email/send");
        await sendReportEmail({
          to: Array.from(targetEmails),
          childName: child.name,
          pdfBuffer
        });
      } catch (error) {
        console.error("Failed to generate and email PDF report:", error);
      }
    } else {
      console.log(`Skipped email sending. Target emails: ${targetEmails.size}, SENDGRID_API_KEY set: ${!!process.env.SENDGRID_API_KEY}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
