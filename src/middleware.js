import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

const protectedApiPaths = ["/api/convert", "/api/paystack/initialize", "/api/paystack/verify", "/api/cloudinary/signature", "/api/cloudinary/delete"];

function unauthorized(request) {
  if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("mivim-session")?.value;
  const session = await verifySessionToken(token);
  const legacyDevelopmentSession = process.env.NODE_ENV !== "production" && token === "active";
  const needsSession = pathname.startsWith("/dashboard") || protectedApiPaths.some((path) => pathname.startsWith(path));

  if (needsSession && !session && !legacyDevelopmentSession) return unauthorized(request);
  if (pathname.startsWith("/dashboard/admin") && !legacyDevelopmentSession && session?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("notice", "admin-required");
    return NextResponse.redirect(url);
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && pathname !== "/api/paystack/webhook") {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
  }

  const forwardedHeaders = new Headers(request.headers);
  if (session) {
    forwardedHeaders.set("X-MiVim-User", session.uid);
    forwardedHeaders.set("X-MiVim-Email", session.email);
    forwardedHeaders.set("X-MiVim-Role", session.role);
  }
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.headers.set("X-MiVim-Request", crypto.randomUUID());
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/reset-password", "/verify-email", "/api/:path*"]
};
