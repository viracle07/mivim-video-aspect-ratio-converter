import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudinaryConfig, hasCloudinaryConfig, signCloudinaryParams } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ publicId: z.string().min(1).max(500) });

export async function POST(request) {
  if (!hasCloudinaryConfig()) return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid deletion request." }, { status: 400 });

  const userId = request.headers.get("x-mivim-user");
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!rateLimit(`cloudinary-delete:${userId}`, 30).allowed) return NextResponse.json({ error: "Too many cloud deletion requests." }, { status: 429 });
  const config = getCloudinaryConfig();
  const requiredPrefix = `${config.folder}/users/${userId}/outputs/`;
  if (!parsed.data.publicId.startsWith(requiredPrefix)) return NextResponse.json({ error: "That video does not belong to this account." }, { status: 403 });

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { invalidate: "true", public_id: parsed.data.publicId, timestamp };
  const body = new URLSearchParams({ ...params, api_key: config.apiKey, signature: signCloudinaryParams(params) });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/video/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !["ok", "not found"].includes(result.result)) return NextResponse.json({ error: result.error?.message || "Cloud video could not be deleted." }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
