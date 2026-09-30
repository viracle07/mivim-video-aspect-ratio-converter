import { NextResponse } from "next/server";
import { hasPaystackConfig } from "@/lib/paystack";
import { paymentsEnabled } from "@/lib/billing-config";

export function GET() {
  return NextResponse.json({ enabled: paymentsEnabled, configured: hasPaystackConfig("monthly") && hasPaystackConfig("yearly") });
}
