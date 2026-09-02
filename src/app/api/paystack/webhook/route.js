import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@/lib/paystack";

export async function POST(request) {
  const payload = await request.text();
  if (!verifyPaystackSignature(payload, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const event = JSON.parse(payload);
  const supportedEvents = ["charge.success", "subscription.create", "subscription.disable", "subscription.not_renew", "invoice.payment_failed"];
  if (supportedEvents.includes(event.event)) console.info("Paystack billing event", event.event, event.data?.reference || event.data?.subscription_code || "");
  return NextResponse.json({ received: true });
}
