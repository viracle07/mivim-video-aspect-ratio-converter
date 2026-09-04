import { NextResponse } from "next/server";
import { createNotification, getEntitlement, listNotifications, markNotificationRead } from "@/lib/firebase-admin-rest";

export async function GET(request) {
  const uid = request.headers.get("X-MiVim-User");
  const role = request.headers.get("X-MiVim-Role");
  if (!uid) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const entitlement = await getEntitlement(uid);
  const expiry = entitlement.expiresAt ? new Date(entitlement.expiresAt) : null;
  if (["monthly", "yearly"].includes(entitlement.plan) && expiry && expiry.getTime() > Date.now() && expiry.getTime() - Date.now() <= 7 * 86400000) {
    await createNotification(uid, { eventKey: `expiry:${expiry.toISOString()}`, type: "subscription", title: "Subscription expiring soon", message: `Your ${entitlement.plan} access expires on ${expiry.toLocaleDateString("en-NG")}.`, href: "/dashboard/billing" });
  }
  const userItems = await listNotifications(uid);
  const adminItems = role === "admin" ? await listNotifications(null, "admin") : [];
  const notifications = [...userItems, ...adminItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ notifications, unread: notifications.filter((item) => !item.read).length });
}

export async function PATCH(request) {
  const uid = request.headers.get("X-MiVim-User");
  const role = request.headers.get("X-MiVim-Role");
  if (!uid) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  await Promise.all(items.map((item) => {
    const scopeName = item.scope === "admin" && role === "admin" ? "admin" : "user";
    return markNotificationRead(uid, String(item.id || ""), scopeName);
  }));
  return NextResponse.json({ updated: items.length });
}
