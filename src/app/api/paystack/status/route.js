import { NextResponse } from "next/server";
import { hasPaystackConfig } from "@/lib/paystack";

export function GET() {
  return NextResponse.json({ configured: hasPaystackConfig("monthly") && hasPaystackConfig("yearly") });
}
