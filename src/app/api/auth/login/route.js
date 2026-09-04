import { NextResponse } from "next/server";
import { z } from "zod";
import { adminEmails, firebaseConfig, hasFirebaseConfig } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200)
});

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`login:${ip}`, 10).allowed) {
    return NextResponse.json({ error: "Too many login attempts. Please wait and try again." }, { status: 429 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid login request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  if (!hasFirebaseConfig) return NextResponse.json({ error: "Firebase authentication is not configured." }, { status: 503 });

  const firebaseResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...parsed.data, returnSecureToken: true }),
    cache: "no-store"
  });
  const firebaseResult = await firebaseResponse.json();
  if (!firebaseResponse.ok) {
    const code = firebaseResult.error?.message;
    const message = code === "EMAIL_NOT_FOUND" || code === "INVALID_PASSWORD" || code === "INVALID_LOGIN_CREDENTIALS"
      ? "The email or password is incorrect."
      : code === "USER_DISABLED" ? "This account has been disabled." : "Firebase could not complete the login.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const email = firebaseResult.email.toLowerCase();
  const role = adminEmails.includes(email) ? "admin" : "user";
  const token = await createSessionToken({ uid: firebaseResult.localId, email, role });
  const response = NextResponse.json({ uid: firebaseResult.localId, email, emailVerified: firebaseResult.emailVerified, role });
  response.cookies.set("mivim-session", token, sessionCookieOptions);
  return response;
}
