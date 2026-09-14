import Razorpay from "razorpay";

/**
 * Constructed lazily, not at module load. Next's build step imports every
 * route module to collect page data, and a module-scope `new Razorpay(...)`
 * throws if the key env vars aren't present in that build environment —
 * which broke `npm run build` outright. A real request always has them.
 */
let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}
