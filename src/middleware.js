import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard"];
const authPaths = ["/login", "/signup", "/reset-password", "/verify-email"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("mivim-session");

  if (protectedPaths.some((path) => pathname.startsWith(path)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (authPaths.includes(pathname) && hasSession && pathname !== "/verify-email") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("X-MiVim-Request", crypto.randomUUID());
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/reset-password", "/verify-email", "/api/:path*"]
};
