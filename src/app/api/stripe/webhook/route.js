import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ received: true, demo: true });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "checkout.session.completed":
      console.info("Stripe subscription event", event.type);
      break;
    default:
      console.info("Unhandled Stripe event", event.type);
  }

  return NextResponse.json({ received: true });
}
