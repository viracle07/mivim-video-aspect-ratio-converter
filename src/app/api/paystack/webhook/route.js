import { NextResponse } from "next/server";
import { getPaystackPlan, verifyPaystackSignature } from "@/lib/paystack";
import { activatePaidEntitlement, findBillingUser, indexBillingCustomer, updateEntitlementStatus } from "@/lib/firebase-admin-rest";

function customerEmail(data) {
  return data?.customer?.email || data?.customer_email || data?.subscription?.customer?.email || "";
}

function subscriptionCode(data) {
  return data?.subscription_code || data?.subscription?.subscription_code || data?.subscription || "";
}

function planFromEvent(data) {
  const code = data?.plan?.plan_code || data?.plan || data?.subscription?.plan?.plan_code || data?.subscription?.plan;
  if (code === getPaystackPlan("yearly").code) return "yearly";
  if (code === getPaystackPlan("monthly").code) return "monthly";
  return data?.metadata?.mivim_plan === "yearly" ? "yearly" : data?.metadata?.mivim_plan === "monthly" ? "monthly" : null;
}

async function resolveUser(data) {
  return data?.metadata?.mivim_uid || findBillingUser(customerEmail(data));
}

export async function POST(request) {
  const payload = await request.text();
  if (!verifyPaystackSignature(payload, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event;
  try { event = JSON.parse(payload); } catch { return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 }); }
  const supportedEvents = ["charge.success", "subscription.create", "subscription.disable", "subscription.not_renew", "invoice.payment_failed", "invoice.update"];
  if (!supportedEvents.includes(event.event)) return NextResponse.json({ received: true, ignored: true });

  try {
    const data = event.data || {};
    const uid = await resolveUser(data);
    const email = customerEmail(data).toLowerCase();
    if (!uid) return NextResponse.json({ received: true, skipped: "unmatched-customer" });
    if (email) await indexBillingCustomer(email, uid);
    const details = {
      customerCode: data.customer?.customer_code || "",
      subscriptionCode: subscriptionCode(data)
    };

    if (event.event === "charge.success" || (event.event === "invoice.update" && data.paid === true)) {
      const plan = planFromEvent(data);
      const paidAt = data.paid_at || data.paidAt;
      if (plan && paidAt) {
        const expectedAmount = getPaystackPlan(plan).amount;
        if (!expectedAmount || Number(data.amount) === expectedAmount) {
          await activatePaidEntitlement(uid, plan, data.reference || data.invoice_code || "webhook", paidAt, {
            ...details,
            expiresAt: data.period_end || undefined
          });
        }
      }
    } else if (event.event === "subscription.create") {
      await updateEntitlementStatus(uid, "active", details);
    } else if (event.event === "subscription.not_renew") {
      await updateEntitlementStatus(uid, "non-renewing", details);
    } else if (event.event === "invoice.payment_failed") {
      await updateEntitlementStatus(uid, "attention", details);
    } else if (event.event === "subscription.disable") {
      await updateEntitlementStatus(uid, "disabled", details);
    }
    console.info("Paystack billing event processed", event.event, data.reference || subscriptionCode(data));
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", event.event, error.message);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
