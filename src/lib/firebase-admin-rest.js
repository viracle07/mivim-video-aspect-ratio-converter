import crypto from "node:crypto";

const tokenUrl = "https://oauth2.googleapis.com/token";
const scope = "https://www.googleapis.com/auth/datastore";
let cachedToken = null;

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function getAdminConfig() {
  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")
  };
}

async function getAccessToken() {
  if (cachedToken?.expiresAt > Date.now() + 60000) return cachedToken.value;
  const config = getAdminConfig();
  if (!config.projectId || !config.clientEmail || !config.privateKey) throw new Error("Firebase Admin is not configured.");
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iss: config.clientEmail, scope, aud: tokenUrl, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), config.privateKey).toString("base64url");
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error("Firebase Admin authentication failed.");
  cachedToken = { value: result.access_token, expiresAt: Date.now() + Number(result.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

function documentUrl(uid) {
  const { projectId } = getAdminConfig();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}/private/entitlement`;
}

function workspaceDocumentUrl(uid) {
  const { projectId } = getAdminConfig();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
}

function decodeDocument(document) {
  const fields = document?.fields || {};
  return {
    plan: fields.plan?.stringValue || "trial",
    status: fields.status?.stringValue || "trial",
    freeUploadsUsed: Number(fields.freeUploadsUsed?.integerValue || 0),
    paymentReference: fields.paymentReference?.stringValue || "",
    expiresAt: fields.expiresAt?.timestampValue || null,
    updatedAt: fields.updatedAt?.timestampValue || null,
    updateTime: document?.updateTime || null
  };
}

async function requestDocument(uid, options = {}) {
  const token = await getAccessToken();
  return fetch(documentUrl(uid) + (options.query || ""), {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
    cache: "no-store"
  });
}

export async function getEntitlement(uid) {
  const response = await requestDocument(uid);
  if (response.status === 404) {
    const token = await getAccessToken();
    const workspaceResponse = await fetch(workspaceDocumentUrl(uid), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!workspaceResponse.ok) return decodeDocument(null);
    const workspace = await workspaceResponse.json();
    const jobs = workspace.fields?.jobs?.arrayValue?.values || [];
    const existingUploads = jobs.filter((job) => job.mapValue?.fields?.sourceStorage?.stringValue).length;
    return { ...decodeDocument(null), freeUploadsUsed: Math.min(3, existingUploads) };
  }
  if (!response.ok) throw new Error("Account access could not be checked.");
  return decodeDocument(await response.json());
}

async function writeEntitlement(uid, entitlement, updateTime) {
  const fields = {
    plan: { stringValue: entitlement.plan },
    status: { stringValue: entitlement.status },
    freeUploadsUsed: { integerValue: String(entitlement.freeUploadsUsed || 0) },
    paymentReference: { stringValue: entitlement.paymentReference || "" },
    expiresAt: entitlement.expiresAt ? { timestampValue: entitlement.expiresAt } : { nullValue: null },
    updatedAt: { timestampValue: new Date().toISOString() }
  };
  const precondition = updateTime
    ? `?currentDocument.updateTime=${encodeURIComponent(updateTime)}`
    : "?currentDocument.exists=false";
  return requestDocument(uid, { method: "PATCH", query: precondition, body: JSON.stringify({ fields }) });
}

export async function consumeConversionAccess(uid) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await getEntitlement(uid);
    if (["monthly", "yearly"].includes(current.plan) && current.status === "active" && new Date(current.expiresAt).getTime() > Date.now()) {
      return { allowed: true, paid: true, freeUploadsUsed: current.freeUploadsUsed };
    }
    if (current.freeUploadsUsed >= 3) return { allowed: false, paid: false, freeUploadsUsed: current.freeUploadsUsed };
    const next = { ...current, plan: "trial", status: "trial", freeUploadsUsed: current.freeUploadsUsed + 1 };
    const response = await writeEntitlement(uid, next, current.updateTime);
    if (response.ok) return { allowed: true, paid: false, freeUploadsUsed: next.freeUploadsUsed };
    if (![409, 412].includes(response.status)) throw new Error("Free upload usage could not be saved.");
  }
  throw new Error("Account usage changed. Please try again.");
}

export async function activatePaidEntitlement(uid, plan, paymentReference, paidAt) {
  const paidDate = new Date(paidAt);
  const expiresAt = new Date(paidDate);
  if (plan === "yearly") expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  else expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await getEntitlement(uid);
    const response = await writeEntitlement(uid, { ...current, plan, status: "active", paymentReference, expiresAt: expiresAt.toISOString() }, current.updateTime);
    if (response.ok) return true;
    if (![409, 412].includes(response.status)) throw new Error("Subscription access could not be saved.");
  }
  throw new Error("Subscription access changed. Please verify again.");
}

export async function deleteEntitlement(uid) {
  const response = await requestDocument(uid, { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw new Error("Entitlement could not be deleted.");
}
