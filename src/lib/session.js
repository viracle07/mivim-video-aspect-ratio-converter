const encoder = new TextEncoder();
const sessionLifetime = 14 * 24 * 60 * 60;
const sessionVersion = 2;

function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  return process.env.NODE_ENV === "production" ? null : "mivim-local-development-session-secret";
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(value) {
  const secret = getSecret();
  if (!secret) return null;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function createSessionToken(identity) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ ...identity, version: sessionVersion, exp: Math.floor(Date.now() / 1000) + sessionLifetime })));
  const signature = await hmac(payload);
  if (!signature) throw new Error("SESSION_SECRET is required in production.");
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  try {
    const [payload, signature] = token.split(".");
    const expected = await hmac(payload);
    const received = fromBase64Url(signature);
    if (!expected || expected.length !== received.length) return null;
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ received[index];
    if (difference !== 0) return null;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (session.version !== sessionVersion) return null;
    if (!session.exp || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: sessionLifetime
};
