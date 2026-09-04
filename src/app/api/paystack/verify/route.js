import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaystackPlan, paystackRequest } from "@/lib/paystack";
import { activatePaidEntitlement, indexBillingCustomer } from "@/lib/firebase-admin-rest";

const referenceSchema = z.string().regex(/^[A-Za-z0-9.=-]+$/).max(120);

export async function GET(request) {
  const uid = request.headers.get("X-MiVim-User");
  const sessionEmail = request.headers.get("X-MiVim-Email")?.toLowerCase();
  if (!uid) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = referenceSchema.safeParse(new URL(request.url).searchParams.get("reference"));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });

  try {
    const transaction = await paystackRequest(`/transaction/verify/${encodeURIComponent(parsed.data)}`);
    const planId = transaction.metadata?.mivim_plan === "yearly" ? "yearly" : "monthly";
    const plan = getPaystackPlan(planId);
    const planCode = transaction.plan?.plan_code || transaction.plan;
    const validPlan = planCode === plan.code;
    const paystackPlan = plan.amount ? null : await paystackRequest(`/plan/${encodeURIComponent(plan.code)}`);
    const expectedAmount = plan.amount || Number(paystackPlan?.amount);
    const validAmount = Boolean(expectedAmount) && Number(transaction.amount) === expectedAmount;
    const validCustomer = Boolean(sessionEmail) && transaction.customer?.email?.toLowerCase() === sessionEmail;
    if (transaction.status !== "success" || !validPlan || !validAmount || !validCustomer) {
      return NextResponse.json({ error: "Payment verification did not match the selected plan." }, { status: 400 });
    }

    const customerCode = transaction.customer?.customer_code || "";
    await activatePaidEntitlement(uid, planId, transaction.reference, transaction.paid_at, {
      customerCode,
      subscriptionCode: transaction.subscription?.subscription_code || transaction.subscription || ""
    });
    await indexBillingCustomer(sessionEmail, uid);

    return NextResponse.json({
      verified: true,
      plan: planId,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      paidAt: transaction.paid_at,
      customerCode: customerCode || null
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Payment could not be verified." }, { status: 502 });
  }
}
