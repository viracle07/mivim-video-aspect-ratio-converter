import { NextResponse } from "next/server";
import { z } from "zod";
import { adminEmails, firebaseConfig, hasFirebaseConfig } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

const schema = z.object({
  email: z.string().email().max(254),
  uid: z.string().min(1).max(180),
  idToken: z.string().min(20).max(5000).nullable().optional()
});

async function verifyFirebaseIdentity(idToken) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store"
  });
  if (!response.ok) return null;
  const result = await response.json();
  return result.users?.[0] || null;
}

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
    const verified = await verifyFirebaseIdentity(parsed.data.idToken);
    if (!verified || verified.localId !== parsed.data.uid || verified.email?.toLowerCase() !== parsed.data.email.toLowerCase()) {
      return NextResponse.json({ error: "Authentication could not be verified." }, { status: 401 });
    }
    identity = { uid: verified.localId, email: verified.email };
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Firebase must be configured in production." }, { status: 503 });
  }

  const email = identity.email.toLowerCase();
  const role = process.env.NODE_ENV !== "production" || adminEmails.includes(email) ? "admin" : "user";
  const token = await createSessionToken({ uid: identity.uid, email, role });
  const response = NextResponse.json({ authenticated: true, role });
  response.cookies.set("mivim-session", token, sessionCookieOptions);
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("mivim-session", "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
