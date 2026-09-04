import { NextResponse } from "next/server";
import { listAdminLogs, listPlatformUsers } from "@/lib/firebase-admin-rest";

export async function GET(request) {
  if (request.headers.get("x-mivim-role") !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    const [users, logs] = await Promise.all([listPlatformUsers(), listAdminLogs()]);
    const totals = users.reduce((result, user) => ({
      users: result.users + 1,
      paid: result.paid + (["monthly", "yearly"].includes(user.plan) && ["active", "non-renewing", "attention"].includes(user.status) ? 1 : 0),
      conversions: result.conversions + user.conversions,
      failed: result.failed + user.failed
    }), { users: 0, paid: 0, conversions: 0, failed: 0 });
    return NextResponse.json({ users, logs, totals });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Admin overview could not be loaded." }, { status: 503 });
  }
}
