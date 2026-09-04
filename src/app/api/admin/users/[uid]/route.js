import { NextResponse } from "next/server";
import { z } from "zod";
import { setAdminEntitlement, writeAdminLog } from "@/lib/firebase-admin-rest";

const schema = z.object({
  action: z.enum(["suspend", "reactivate", "reset-free-uploads", "grant-plan"]),
  plan: z.enum(["monthly", "yearly"]).optional()
}).refine((value) => value.action !== "grant-plan" || value.plan, { message: "A plan is required." });

export async function PATCH(request, { params }) {
  if (request.headers.get("x-mivim-role") !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const { uid } = await params;
  if (!uid || uid.length > 180) return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid admin request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
  try {
    await setAdminEntitlement(uid, parsed.data.action, parsed.data.plan);
    await writeAdminLog(request.headers.get("x-mivim-email") || "admin", parsed.data.action, uid, { plan: parsed.data.plan || null });
    return NextResponse.json({ updated: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "User access could not be updated." }, { status: 503 });
  }
}
