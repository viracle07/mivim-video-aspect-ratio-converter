import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { consumeConversionAccess, createNotification } from "@/lib/firebase-admin-rest";

const schema = z.object({
  fileName: z.string().min(1).max(180),
  ratio: z.enum(["9:16", "1:1", "16:9", "4:5"]),
  fitMode: z.enum(["blur", "solid"]).default("blur"),
  quality: z.enum(["720p", "1080p"]).default("720p"),
  frameRate: z.enum(["original", "24", "30", "60"]).default("original"),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#101418"),
  sizeBytes: z.number().int().positive().max(500 * 1024 * 1024),
  duration: z.number().nonnegative().max(21600),
  width: z.number().int().positive().max(16384),
  height: z.number().int().positive().max(16384)
});

export async function POST(request) {
  const uid = request.headers.get("X-MiVim-User");
  if (!uid) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") || "local";
  const bucket = rateLimit(`convert:${ip}`, 10);
  if (!bucket.allowed) {
    return NextResponse.json({ error: "Too many conversion requests." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid conversion request." }, { status: 400 });
  }

  let access;
  try {
    access = await consumeConversionAccess(uid);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Account access could not be checked." }, { status: 503 });
  }
  if (!access.allowed) {
    await createNotification(uid, { eventKey: "trial-exhausted", type: "trial", title: "Free uploads finished", message: "You have used all 3 free video uploads. Choose a plan to continue converting.", href: "/dashboard/billing" }).catch(() => {});
    return NextResponse.json({ error: "Your 3 free uploads have been used. Choose a plan from Billing to continue." }, { status: 402 });
  }
  if (!access.paid && access.freeUploadsUsed === 3) {
    await createNotification(uid, { eventKey: "trial-exhausted", type: "trial", title: "This is your final free upload", message: "Your 3 free uploads are now used. Subscribe to continue after this conversion.", href: "/dashboard/billing" }).catch(() => {});
  }

  const job = {
    id: `job_${crypto.randomUUID()}`,
    status: "queued",
    progress: 0,
    ...parsed.data,
    targetRatio: parsed.data.ratio,
    createdAt: new Date().toISOString(),
    sourceStorage: "indexeddb"
  };

  return NextResponse.json({ job, access });
}
