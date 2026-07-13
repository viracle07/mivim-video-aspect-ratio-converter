import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard"];

export function middleware(request) {
  const response = NextResponse.next();
  response.headers.set("X-MiVim-Request", crypto.randomUUID());

  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const hasDemoSession = request.cookies.has("mivim-session");

  if (isProtected && !hasDemoSession) {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
};
