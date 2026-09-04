import { NextResponse } from "next/server";
import { z } from "zod";
import { appUrl } from "@/lib/env";
import { getPaystackPlan, hasPaystackConfig, paystackRequest } from "@/lib/paystack";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(254),
  plan: z.enum(["monthly", "yearly"])
});

export async function POST(request) {
  const uid = request.headers.get("x-mivim-user");
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`paystack:${ip}`, 8).allowed) return NextResponse.json({ error: "Too many payment attempts." }, { status: 429 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid payment request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid plan and account email." }, { status: 400 });
  if (request.headers.get("x-mivim-email")?.toLowerCase() !== parsed.data.email.toLowerCase()) {
    return NextResponse.json({ error: "Payment email must match the signed-in account." }, { status: 403 });
  }
  if (!hasPaystackConfig(parsed.data.plan)) return NextResponse.json({ error: "Paystack setup is incomplete. Add your secret key and plan codes to .env.local." }, { status: 503 });

  try {
    const plan = getPaystackPlan(parsed.data.plan);
    const paystackPlan = plan.amount ? null : await paystackRequest(`/plan/${encodeURIComponent(plan.code)}`);
    const amount = plan.amount || Number(paystackPlan?.amount);
    if (!amount) throw new Error("The selected Paystack plan has no valid amount.");
    const data = await paystackRequest("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: parsed.data.email,
        plan: plan.code,
        amount,
        callback_url: `${appUrl}/dashboard/billing`,
        metadata: { mivim_uid: uid, mivim_plan: plan.id, cancel_action: `${appUrl}/dashboard/billing?payment=cancelled` }
      })
    });
    return NextResponse.json({ authorizationUrl: data.authorization_url, reference: data.reference });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Payment could not be started." }, { status: 502 });
  }
}
