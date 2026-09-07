import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";

// Server-side now — this used to be a plain string constant shipped in the
// client bundle, so anyone reading the JS could read the launch code too.
const VALID_COUPON = "GENIUS99";

export async function POST(req: Request) {
  try {
    const { childId, code } = await req.json();
    if (!childId || !code) {
      return NextResponse.json({ error: "childId and code required" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: child } = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    if (code.trim().toUpperCase() !== VALID_COUPON) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    // A coupon redemption is a payment record too — amount 0, method noted —
    // so "does this child have a paid record" stays the one gate the
    // assessments table checks, coupon or real money.
    const serviceClient = getSupabaseServiceRoleClient();
    const { error: insertError } = await serviceClient.from("payments").insert({
      profile_id: user.id,
      child_id: childId,
      razorpay_order_id: `coupon_${randomUUID()}`,
      amount_paise: 0,
      currency: "INR",
      status: "paid",
      paid_at: new Date().toISOString(),
      notes: { method: "coupon", code: VALID_COUPON },
    });
    if (insertError) {
      console.error("Failed to record coupon redemption:", insertError);
      return NextResponse.json({ error: "Failed to redeem coupon" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Coupon redemption error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
