import { NextResponse } from "next/server";
import { z } from "zod";
import { adminEmails, hasFirebaseConfig } from "@/lib/env";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { verifySessionToken } from "@/lib/session";

const schema = z.object({
  email: z.string().email().max(254),
  uid: z.string().min(1).max(180),
  idToken: z.string().min(20).max(5000).nullable().optional()
});

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`session:${ip}`, 20).allowed) return NextResponse.json({ error: "Too many session requests." }, { status: 429 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid session request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid session identity." }, { status: 400 });

  let identity = parsed.data;
  if (hasFirebaseConfig) {
    if (!parsed.data.idToken) return NextResponse.json({ error: "Firebase authentication is required." }, { status: 401 });
    let verified;
    try { verified = await verifyFirebaseIdToken(parsed.data.idToken); }
    catch (error) {
      console.error("Firebase ID token verification failed", error.code, error.message);
      const configurationError = error.message === "Firebase Admin credentials are not configured.";
      return NextResponse.json({
        error: configurationError
          ? "Google sign-in is not configured on the server."
          : "Google sign-in could not be verified. Please try again."
      }, { status: configurationError ? 503 : 401 });
    }
    if (!verified || verified.uid !== parsed.data.uid || verified.email?.toLowerCase() !== parsed.data.email.toLowerCase()) {
      return NextResponse.json({ error: "Authentication could not be verified." }, { status: 401 });
    }
    identity = { uid: verified.uid, email: verified.email };
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Firebase must be configured in production." }, { status: 503 });
  }

  const email = identity.email.toLowerCase();
  const role = adminEmails.includes(email) ? "admin" : "user";
  const token = await createSessionToken({ uid: identity.uid, email, role });
  const response = NextResponse.json({ authenticated: true, role });
  response.cookies.set("mivim-session", token, sessionCookieOptions);
  return response;
}

export async function GET(request) {
  const session = await verifySessionToken(request.cookies.get("mivim-session")?.value);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user: session });
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("mivim-session", "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
