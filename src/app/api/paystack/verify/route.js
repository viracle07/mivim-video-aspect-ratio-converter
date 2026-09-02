import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaystackPlan, paystackRequest } from "@/lib/paystack";

const referenceSchema = z.string().regex(/^[A-Za-z0-9.=-]+$/).max(120);

export async function GET(request) {
  const parsed = referenceSchema.safeParse(new URL(request.url).searchParams.get("reference"));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });

  try {
    const transaction = await paystackRequest(`/transaction/verify/${encodeURIComponent(parsed.data)}`);
    const planId = transaction.metadata?.mivim_plan === "yearly" ? "yearly" : "monthly";
    const plan = getPaystackPlan(planId);
    const planCode = transaction.plan?.plan_code || transaction.plan;
    const validPlan = planCode === plan.code;
    const expectedAmount = plan.amount || Number(transaction.plan?.amount);
    const validAmount = Boolean(expectedAmount) && Number(transaction.amount) === expectedAmount;
    if (transaction.status !== "success" || !validPlan || !validAmount) {
      return NextResponse.json({ error: "Payment verification did not match the selected plan." }, { status: 400 });
    }

    return NextResponse.json({
      verified: true,
      plan: planId,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      paidAt: transaction.paid_at,
      customerCode: transaction.customer?.customer_code || null
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Payment could not be verified." }, { status: 502 });
  }
}
