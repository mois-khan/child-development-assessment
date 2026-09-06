import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";

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
      const paymentData = payload.payload.payment.entity;
      const { childId } = paymentData.notes;

      // Handle server-to-server DB update
      // Bypass RLS with SERVICE_ROLE_KEY
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: () => {},
          },
        }
      );

      // We'd insert the payment here into the 'payments' table.
      // await supabase.from('payments').insert({ ... })
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
