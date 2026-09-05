import { NextResponse } from "next/server";
import { createNotification, listPlatformUsers, updateEntitlementStatus } from "@/lib/firebase-admin-rest";

export async function GET(request) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const users = await listPlatformUsers();
  const now = Date.now();
  let warnings = 0; let expired = 0;
  for (const user of users) {
    if (!["monthly", "yearly"].includes(user.plan) || !user.expiresAt) continue;
    const end = new Date(user.expiresAt).getTime();
    if (end <= now && !["disabled", "expired"].includes(user.status)) {
      await updateEntitlementStatus(user.uid, "expired"); expired += 1;
      await createNotification(user.uid, { eventKey: `expired:${user.expiresAt}`, type: "subscription", title: "Subscription expired", message: "Your paid access has ended. Choose a plan to continue converting.", href: "/dashboard/billing" });
    } else if (end > now && end - now <= 7 * 86400000) {
      warnings += 1;
      await createNotification(user.uid, { eventKey: `expiry:${user.expiresAt}`, type: "subscription", title: "Subscription expiring soon", message: `Your access expires on ${new Date(user.expiresAt).toLocaleDateString("en-NG")}.`, href: "/dashboard/billing" });
    }
  }
  return NextResponse.json({ checked: users.length, warnings, expired });
}
