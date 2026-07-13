import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  fileName: z.string().min(1).max(180),
  ratio: z.enum(["9:16", "1:1", "16:9", "4:5"])
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
    ...parsed.data
  };

  if (process.env.PROCESSING_SERVICE_URL) {
    await fetch(process.env.PROCESSING_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job)
    });
  }

  return NextResponse.json({ job });
}
