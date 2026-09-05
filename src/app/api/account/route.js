import { NextResponse } from "next/server";
import { deleteAccountData } from "@/lib/firebase-admin-rest";
import { sessionCookieOptions } from "@/lib/session";
import { deleteCloudinaryUserAssets } from "@/lib/cloudinary";

export async function DELETE(request) {
  const uid = request.headers.get("X-MiVim-User");
  const body = await request.json().catch(() => ({}));
  if (!uid || body.confirmation !== "DELETE") return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
  await deleteCloudinaryUserAssets(uid);
  await deleteAccountData(uid);
  const response = NextResponse.json({ deleted: true });
  response.cookies.set("mivim-session", "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
