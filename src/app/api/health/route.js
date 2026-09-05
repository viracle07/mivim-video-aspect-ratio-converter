import { NextResponse } from "next/server";
import { hasCloudinaryConfig } from "@/lib/cloudinary";
import { hasFirebaseConfig } from "@/lib/env";
import { hasPaystackConfig } from "@/lib/paystack";

export function GET() {
  const services = { firebase: hasFirebaseConfig, firebaseAdmin: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY), cloudinary: hasCloudinaryConfig(), paystack: hasPaystackConfig("monthly") && hasPaystackConfig("yearly") };
  const healthy = Object.values(services).every(Boolean);
  return NextResponse.json({ status: healthy ? "ready" : "configuration-required", services, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503 });
}
