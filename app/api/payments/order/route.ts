import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";

// The one real price in the app today. Kept server-side so a modified client
// request can no longer set its own amount (it used to be trusted verbatim
// from the request body).
const PRICE_PAISE = 9900;

export async function POST(req: Request) {
  try {
    const { childId } = await req.json();
    if (!childId) {
      return NextResponse.json({ error: "childId required" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RLS already scopes this to the caller's own children — a stranger's
    // childId just comes back empty rather than someone else's row.
    const { data: child } = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const order = await razorpay.orders.create({
      amount: PRICE_PAISE,
      currency: "INR",
      receipt: `rcpt_${childId}_${Date.now()}`,
      notes: { childId, profileId: user.id },
    });

    const serviceClient = getSupabaseServiceRoleClient();
    const { error: insertError } = await serviceClient.from("payments").insert({
      profile_id: user.id,
      child_id: childId,
      razorpay_order_id: order.id,
      amount_paise: PRICE_PAISE,
      currency: "INR",
      status: "created",
    });
    if (insertError) {
      console.error("Failed to record payment order:", insertError);
      return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
