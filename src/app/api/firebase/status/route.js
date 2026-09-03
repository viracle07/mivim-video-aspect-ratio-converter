import { NextResponse } from "next/server";
import { hasFirebaseConfig } from "@/lib/env";

export function GET() {
  return NextResponse.json({ configured: hasFirebaseConfig });
}
