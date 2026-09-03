import { NextResponse } from "next/server";
import { hasCloudinaryConfig } from "@/lib/cloudinary";

export function GET() {
  return NextResponse.json({ configured: hasCloudinaryConfig() });
}
