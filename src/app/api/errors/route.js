import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/lib/firebase-admin-rest";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ message: z.string().min(1).max(500), digest: z.string().max(200).optional(), path: z.string().max(500).optional() });
export async function POST(request) {
  const uid = request.headers.get("X-MiVim-User");
  if (!uid || !rateLimit(`error:${uid}`, 10).allowed) return NextResponse.json({ received: false }, { status: uid ? 429 : 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ received: false }, { status: 400 });
  await writeAdminLog(request.headers.get("X-MiVim-Email") || uid, "client-error", uid, parsed.data);
  return NextResponse.json({ received: true });
}
