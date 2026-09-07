import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // The webhook is the other writer of this same row (belt-and-braces if
    // this request never completes) — this update is what makes the parent's
    // own checkout feel instant instead of waiting on the webhook to land.
    const serviceClient = getSupabaseServiceRoleClient();
    const { data: updated, error: updateError } = await serviceClient
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id,
        razorpay_signature,
        paid_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("profile_id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to mark payment paid:", updateError);
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
