import Stripe from "stripe";

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia"
  });
}

export function getPriceId(plan) {
  if (plan === "yearly") return process.env.STRIPE_PRICE_YEARLY;
  return process.env.STRIPE_PRICE_MONTHLY;
}
