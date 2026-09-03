import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudinaryConfig, hasCloudinaryConfig, signCloudinaryParams } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ jobId: z.string().regex(/^job_[a-zA-Z0-9-]+$/) });

export async function POST(request) {
  if (!hasCloudinaryConfig()) return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  const userId = request.headers.get("x-mivim-user");
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!rateLimit(`cloudinary-sign:${userId}`, 30).allowed) return NextResponse.json({ error: "Too many cloud upload requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });

  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${config.folder}/users/${userId}/outputs`;
  const publicId = parsed.data.jobId;
  const params = { folder, public_id: publicId, timestamp };

  return NextResponse.json({
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    folder,
    publicId,
    signature: signCloudinaryParams(params)
  });
}
