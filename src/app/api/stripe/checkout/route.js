import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { getPriceId, getStripe } from "@/lib/stripe";

export async function POST(request) {
  const form = await request.formData();
  const plan = form.get("plan") === "yearly" ? "yearly" : "monthly";
  const stripe = getStripe();
  const price = getPriceId(plan);

  if (!stripe || !price) {
    return NextResponse.redirect(`${appUrl}/dashboard/billing?demoCheckout=1`, { status: 303 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
    allow_promotion_codes: true
  });

  return NextResponse.redirect(session.url, { status: 303 });
}
