import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { ResponseValue } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token || typeof token !== "string" || token.length < 8) {
      return NextResponse.json({ error: "Invalid share token" }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceRoleClient();

    // Query assessment by share_token — only completed assessments are shareable
    const { data: a, error: aError } = await serviceClient
      .from("assessments")
      .select("*, children(*)")
      .eq("share_token", token)
      .eq("status", "complete")
      .maybeSingle();

    if (aError || !a) {
      return NextResponse.json({ error: "Report not found or not yet completed" }, { status: 404 });
    }

    // Query responses
    const { data: rData, error: rError } = await serviceClient
      .from("responses")
      .select("item_id, value")
      .eq("assessment_id", a.id);

    if (rError) {
      return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
    }

    const responses: Record<string, ResponseValue> = {};
    for (const r of rData || []) {
      responses[r.item_id] = r.value as ResponseValue;
    }

    const child = Array.isArray(a.children) ? a.children[0] : a.children;

    const storedAssessment = {
      id: a.id,
      child: {
        id: child.id,
        name: child.name,
        dob: child.dob,
        gender: child.gender,
        gestationalWeeks: child.gestational_weeks ?? undefined,
        city: child.city ?? undefined,
        parentName: child.parent_name ?? undefined,
        photoUrl: child.photo_url ?? undefined,
      },
      assessedOn: a.assessed_on,
      stagesByDomain: a.stages_by_domain,
      responses,
      details: a.details,
      bankVersion: a.bank_version,
      completedAt: a.completed_at ?? undefined,
      shareToken: a.share_token,
      reportPdfUrl: (a as any).report_pdf_url ?? null,
    };

    return NextResponse.json({
      success: true,
      assessment: storedAssessment,
      reportPdfUrl: (a as any).report_pdf_url ?? null,
    });
  } catch (err: any) {
    console.error("Public share route error:", err);
    return NextResponse.json({ error: "Failed to load shared report" }, { status: 500 });
  }
}
