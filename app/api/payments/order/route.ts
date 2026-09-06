import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const { amountPaise, childId, metadata } = await req.json();

    const order = await razorpay.orders.create({
      amount: amountPaise, // amount in smallest currency unit
      currency: "INR",
      receipt: `rcpt_${childId}_${Date.now()}`,
      notes: {
        childId,
        ...metadata
      }
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
