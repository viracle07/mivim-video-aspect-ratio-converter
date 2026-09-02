import crypto from "node:crypto";

const apiUrl = "https://api.paystack.co";

export function getPaystackPlan(plan) {
  const yearly = plan === "yearly";
  return {
    id: yearly ? "yearly" : "monthly",
    code: yearly ? process.env.PAYSTACK_PLAN_YEARLY : process.env.PAYSTACK_PLAN_MONTHLY,
    amount: Number(yearly ? process.env.PAYSTACK_AMOUNT_YEARLY : process.env.PAYSTACK_AMOUNT_MONTHLY) || null
  };
}

export function hasPaystackConfig(plan) {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && getPaystackPlan(plan).code);
}

export async function paystackRequest(path, options = {}) {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("Paystack is not configured.");
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers
    },
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok || !result.status) throw new Error(result.message || "Paystack request failed.");
  return result.data;
}

export function verifyPaystackSignature(payload, signature) {
  if (!process.env.PAYSTACK_SECRET_KEY || !signature) return false;
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(payload).digest("hex");
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
