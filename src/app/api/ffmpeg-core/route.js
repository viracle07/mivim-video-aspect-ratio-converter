import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const assets = {
  js: { name: "ffmpeg-core.js", type: "text/javascript; charset=utf-8" },
  wasm: { name: "ffmpeg-core.wasm", type: "application/wasm" }
};

export async function GET(request) {
  const asset = assets[new URL(request.url).searchParams.get("asset")];
  if (!asset) return NextResponse.json({ error: "Unknown FFmpeg asset." }, { status: 404 });

  try {
    const filePath = path.join(process.cwd(), "node_modules", "@ffmpeg", "core", "dist", "esm", asset.name);
    const body = await readFile(filePath);
    return new NextResponse(body, {
      headers: {
        "Content-Type": asset.type,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "FFmpeg runtime is unavailable." }, { status: 500 });
  }
}
