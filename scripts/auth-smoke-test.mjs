import fs from "node:fs";
import crypto from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

const uid = `auth-smoke-${crypto.randomUUID()}`;
const email = "auth-smoke@example.com";
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
  }),
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
});
const auth = getAuth(app);

try {
  const customToken = await auth.createCustomToken(uid, { email });
  const exchange = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    }
  );
  const exchangeBody = await exchange.json();
  if (!exchange.ok) throw new Error(`Token exchange failed: ${exchangeBody.error?.message || exchange.status}`);
  const tokenPayload = JSON.parse(Buffer.from(exchangeBody.idToken.split(".")[1], "base64url").toString("utf8"));
  const session = await fetch("http://localhost:3000/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: tokenPayload.sub, email, idToken: exchangeBody.idToken })
  });
  if (!session.ok) throw new Error(`Session failed (${session.status}): ${await session.text()}`);

  const cookie = (session.headers.get("set-cookie") || "").split(";")[0];
  const dashboard = await fetch("http://localhost:3000/dashboard", {
    headers: { Cookie: cookie },
    redirect: "manual"
  });
  if (!cookie || dashboard.status !== 200) {
    throw new Error(`Dashboard access failed (${dashboard.status}): ${dashboard.headers.get("location") || "no redirect"}`);
  }

  console.log("Firebase token, session cookie, and dashboard access passed.");
} finally {
  await auth.deleteUser(uid).catch(() => {});
}
