import { NextResponse } from "next/server";
import { getEntitlement, listNotifications } from "@/lib/firebase-admin-rest";

export async function GET(request) {
  const uid = request.headers.get("X-MiVim-User");
  const email = request.headers.get("X-MiVim-Email");
  if (!uid) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const [entitlement, notifications] = await Promise.all([getEntitlement(uid), listNotifications(uid)]);
  const response = NextResponse.json({ exportedAt: new Date().toISOString(), account: { uid, email }, entitlement, notifications });
  response.headers.set("Content-Disposition", `attachment; filename="mivim-account-${uid}.json"`);
  return response;
}
