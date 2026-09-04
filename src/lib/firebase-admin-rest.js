import crypto from "node:crypto";

const tokenUrl = "https://oauth2.googleapis.com/token";
const scope = "https://www.googleapis.com/auth/cloud-platform";
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

function customerDocumentUrl(email) {
  const { projectId } = getAdminConfig();
  const id = crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/billingCustomers/${id}`;
}

function notificationUrl(uid, id, scopeName = "user") {
  const { projectId } = getAdminConfig();
  const collection = scopeName === "admin" ? "adminNotifications" : `users/${encodeURIComponent(uid)}/notifications`;
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${collection}`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

function encodeFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (value === null || value === undefined) return [key, { nullValue: null }];
    if (typeof value === "boolean") return [key, { booleanValue: value }];
    if (typeof value === "number") return [key, { integerValue: String(value) }];
    return [key, key.endsWith("At") ? { timestampValue: value } : { stringValue: String(value) }];
  }));
}

export async function createNotification(uid, notification, scopeName = "user") {
  const token = await getAccessToken();
  const eventKey = notification.eventKey || crypto.randomUUID();
  const id = crypto.createHash("sha256").update(`${scopeName}:${uid || "all"}:${eventKey}`).digest("hex").slice(0, 40);
  const response = await fetch(notificationUrl(uid, id, scopeName), {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: encodeFields({ type: notification.type || "update", title: notification.title, message: notification.message, href: notification.href || "", read: false, createdAt: notification.createdAt || new Date().toISOString(), eventKey }) }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Notification could not be saved.");
  return id;
}

export async function listNotifications(uid, scopeName = "user") {
  const token = await getAccessToken();
  const response = await fetch(`${notificationUrl(uid, null, scopeName)}?pageSize=50&orderBy=createdAt%20desc`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return [];
  const result = await response.json();
  return (result.documents || []).map((document) => ({ id: document.name.split("/").pop(), scope: scopeName, ...Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, decodeValue(value)])) }));
}

export async function markNotificationRead(uid, id, scopeName = "user") {
  const token = await getAccessToken();
  const response = await fetch(`${notificationUrl(uid, id, scopeName)}?updateMask.fieldPaths=read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: { read: { booleanValue: true } } }), cache: "no-store" });
  if (!response.ok) throw new Error("Notification could not be updated.");
}

function decodeDocument(document) {
  const fields = document?.fields || {};
  return {
    plan: fields.plan?.stringValue || "trial",
    status: fields.status?.stringValue || "trial",
    freeUploadsUsed: Number(fields.freeUploadsUsed?.integerValue || 0),
    paymentReference: fields.paymentReference?.stringValue || "",
    customerCode: fields.customerCode?.stringValue || "",
    subscriptionCode: fields.subscriptionCode?.stringValue || "",
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
    customerCode: { stringValue: entitlement.customerCode || "" },
    subscriptionCode: { stringValue: entitlement.subscriptionCode || "" },
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
    if (["monthly", "yearly"].includes(current.plan) && ["active", "non-renewing", "attention"].includes(current.status) && new Date(current.expiresAt).getTime() > Date.now()) {
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

export async function activatePaidEntitlement(uid, plan, paymentReference, paidAt, details = {}) {
  const paidDate = new Date(paidAt);
  const expiresAt = new Date(paidDate);
  if (plan === "yearly") expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  else expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await getEntitlement(uid);
    const response = await writeEntitlement(uid, { ...current, ...details, plan, status: "active", paymentReference, expiresAt: details.expiresAt || expiresAt.toISOString() }, current.updateTime);
    if (response.ok) return true;
    if (![409, 412].includes(response.status)) throw new Error("Subscription access could not be saved.");
  }
  throw new Error("Subscription access changed. Please verify again.");
}

export async function indexBillingCustomer(email, uid) {
  const token = await getAccessToken();
  const response = await fetch(customerDocumentUrl(email), {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { uid: { stringValue: uid }, email: { stringValue: email.toLowerCase() }, updatedAt: { timestampValue: new Date().toISOString() } } }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Billing customer could not be indexed.");
}

export async function findBillingUser(email) {
  if (!email) return null;
  const token = await getAccessToken();
  const response = await fetch(customerDocumentUrl(email), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return null;
  const document = await response.json();
  return document.fields?.uid?.stringValue || null;
}

export async function deleteBillingCustomer(email) {
  const token = await getAccessToken();
  const response = await fetch(customerDocumentUrl(email), { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok && response.status !== 404) throw new Error("Billing customer index could not be deleted.");
}

export async function updateEntitlementStatus(uid, status, details = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await getEntitlement(uid);
    const response = await writeEntitlement(uid, { ...current, ...details, status }, current.updateTime);
    if (response.ok) return true;
    if (![409, 412].includes(response.status)) throw new Error("Subscription status could not be saved.");
  }
  throw new Error("Subscription status changed. Please retry.");
}

function decodeValue(value) {
  if (!value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decodeValue);
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeValue(item)]));
  return null;
}

export async function listPlatformUsers() {
  const token = await getAccessToken();
  const { projectId } = getAdminConfig();
  const [workspaceResponse, authResponse] = await Promise.all([
    fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users?pageSize=100`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
    fetch(`https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:batchGet?maxResults=1000`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
  ]);
  if (!workspaceResponse.ok) throw new Error("User workspaces could not be loaded.");
  if (!authResponse.ok) throw new Error("Firebase Authentication users could not be loaded.");
  const workspaceResult = await workspaceResponse.json();
  const authResult = await authResponse.json();
  const workspaces = new Map((workspaceResult.documents || []).map((document) => {
    const uid = document.name.split("/").pop();
    return [uid, { document, data: Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, decodeValue(value)])) }];
  }));
  return Promise.all((authResult.users || []).map(async (account) => {
    const uid = account.localId;
    const stored = workspaces.get(uid);
    const workspace = stored?.data || {};
    const entitlement = await getEntitlement(uid);
    const jobs = Array.isArray(workspace.jobs) ? workspace.jobs : [];
    return {
      uid,
      email: account.email || workspace.profile?.email || "",
      displayName: account.displayName || workspace.profile?.displayName || "Creator",
      emailVerified: Boolean(account.emailVerified),
      disabled: Boolean(account.disabled),
      createdAt: account.createdAt ? new Date(Number(account.createdAt)).toISOString() : null,
      lastLoginAt: account.lastLoginAt ? new Date(Number(account.lastLoginAt)).toISOString() : null,
      plan: entitlement.plan,
      status: entitlement.status,
      freeUploadsUsed: entitlement.freeUploadsUsed,
      expiresAt: entitlement.expiresAt,
      conversions: jobs.length,
      completed: jobs.filter((job) => job.status === "completed").length,
      failed: jobs.filter((job) => job.status === "failed").length,
      updatedAt: workspace.contentUpdatedAt || stored?.document.updateTime || null
    };
  }));
}

export async function setAdminEntitlement(uid, action, plan) {
  const current = await getEntitlement(uid);
  if (action === "suspend") return updateEntitlementStatus(uid, "suspended");
  if (action === "reactivate") {
    const paid = ["monthly", "yearly"].includes(current.plan) && new Date(current.expiresAt).getTime() > Date.now();
    return updateEntitlementStatus(uid, paid ? "active" : "trial");
  }
  if (action === "reset-free-uploads") {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const latest = await getEntitlement(uid);
      const response = await writeEntitlement(uid, { ...latest, freeUploadsUsed: 0 }, latest.updateTime);
      if (response.ok) return true;
      if (![409, 412].includes(response.status)) throw new Error("Free uploads could not be reset.");
    }
  }
  if (action === "grant-plan" && ["monthly", "yearly"].includes(plan)) {
    return activatePaidEntitlement(uid, plan, `admin:${crypto.randomUUID()}`, new Date().toISOString());
  }
  throw new Error("Invalid administrator action.");
}

export async function writeAdminLog(actor, action, targetUid, details = {}) {
  const token = await getAccessToken();
  const { projectId } = getAdminConfig();
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/adminLogs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: {
      actor: { stringValue: actor }, action: { stringValue: action }, targetUid: { stringValue: targetUid },
      details: { stringValue: JSON.stringify(details) }, createdAt: { timestampValue: new Date().toISOString() }
    } }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Admin audit log could not be saved.");
}

export async function listAdminLogs() {
  const token = await getAccessToken();
  const { projectId } = getAdminConfig();
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/adminLogs?pageSize=50&orderBy=createdAt%20desc`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return [];
  const result = await response.json();
  return (result.documents || []).map((document) => Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, decodeValue(value)])));
}

export async function deleteEntitlement(uid) {
  const response = await requestDocument(uid, { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw new Error("Entitlement could not be deleted.");
}
