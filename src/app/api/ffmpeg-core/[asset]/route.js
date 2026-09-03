import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const assets = {
  "ffmpeg-core.js": { file: "ffmpeg-core.js", type: "text/javascript; charset=utf-8" },
  "ffmpeg-core.wasm": { file: "ffmpeg-core.wasm", type: "application/wasm" },
  "ffmpeg-core-umd-v1.js": { file: "ffmpeg-core.js", type: "text/javascript; charset=utf-8" },
  "ffmpeg-core-umd-v1.wasm": { file: "ffmpeg-core.wasm", type: "application/wasm" }
};

export async function GET(_request, { params }) {
  const { asset } = await params;
  const definition = assets[asset];
  if (!definition) return NextResponse.json({ error: "Unknown FFmpeg asset." }, { status: 404 });

  try {
    const body = await readFile(path.join(process.cwd(), "node_modules", "@ffmpeg", "core", "dist", "umd", definition.file));
    return new NextResponse(body, {
      headers: {
        "Content-Type": definition.type,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "FFmpeg runtime is unavailable." }, { status: 500 });
  }
}
