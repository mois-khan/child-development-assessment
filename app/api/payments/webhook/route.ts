import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;

      // Backup path for the same write /api/payments/verify already makes on
      // the happy path — this is what covers a parent closing the tab before
      // the checkout handler's fetch resolves. Update-only: the row always
      // already exists from /api/payments/order, created at "created" status.
      const supabase = getSupabaseServiceRoleClient();
      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          razorpay_payment_id: paymentEntity.id,
          paid_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", paymentEntity.order_id)
        .eq("status", "created");

      if (error) {
        console.error("Webhook failed to mark payment paid:", error);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
