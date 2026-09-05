import { NextResponse } from "next/server";
import { getEntitlement } from "@/lib/firebase-admin-rest";

export async function GET(request) {
  const uid = request.headers.get("X-MiVim-User");
  if (!uid) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const entitlement = await getEntitlement(uid);
    const expiresAt = entitlement.expiresAt || null;
    const paid = ["monthly", "yearly"].includes(entitlement.plan)
      && ["active", "non-renewing", "attention"].includes(entitlement.status)
      && Boolean(expiresAt)
      && new Date(expiresAt).getTime() > Date.now();
    return NextResponse.json({
      plan: paid ? entitlement.plan : "trial",
      status: entitlement.status,
      paid,
      freeUploadsUsed: entitlement.freeUploadsUsed,
      freeUploadsRemaining: Math.max(0, 3 - entitlement.freeUploadsUsed),
      expiresAt
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Account access could not be loaded." }, { status: 503 });
  }
}
