import { NextResponse } from "next/server";
import { createNotification, getEntitlement, updateEntitlementStatus } from "@/lib/firebase-admin-rest";
import { paystackRequest } from "@/lib/paystack";

export async function POST(request) {
  const uid = request.headers.get("X-MiVim-User");
  if (!uid) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const entitlement = await getEntitlement(uid);
  if (!entitlement.subscriptionCode || !entitlement.emailToken) return NextResponse.json({ error: "Paystack has not supplied subscription management details yet. Please try again after the next webhook update." }, { status: 409 });
  const body = await request.json().catch(() => ({}));
  const action = body.action === "enable" ? "enable" : "disable";
  await paystackRequest(`/subscription/${action}`, { method: "POST", body: JSON.stringify({ code: entitlement.subscriptionCode, token: entitlement.emailToken }) });
  const status = action === "enable" ? "active" : "non-renewing";
  await updateEntitlementStatus(uid, status);
  await createNotification(uid, { eventKey: `subscription-${action}:${entitlement.subscriptionCode}`, type: "subscription", title: action === "enable" ? "Renewal restored" : "Renewal cancelled", message: action === "enable" ? "Your subscription will renew at the end of this billing period." : "Your access remains active until the current billing period ends.", href: "/dashboard/billing" });
  return NextResponse.json({ updated: true, status });
}
