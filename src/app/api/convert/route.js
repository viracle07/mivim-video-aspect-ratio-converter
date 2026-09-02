import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  fileName: z.string().min(1).max(180),
  ratio: z.enum(["9:16", "1:1", "16:9", "4:5"]),
  sizeBytes: z.number().int().positive().max(500 * 1024 * 1024),
  duration: z.number().nonnegative().max(21600),
  width: z.number().int().positive().max(16384),
  height: z.number().int().positive().max(16384)
});

export async function POST(request) {
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

  const job = {
    id: `job_${crypto.randomUUID()}`,
    status: "queued",
    progress: 0,
    ...parsed.data,
    targetRatio: parsed.data.ratio,
    createdAt: new Date().toISOString(),
    sourceStorage: "indexeddb"
  };

  return NextResponse.json({ job });
}
