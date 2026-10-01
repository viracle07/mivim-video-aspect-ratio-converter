import { NextResponse } from "next/server";

async function proxyFirebaseAuth(request, { params }) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim().replace(/^['"]|['"]$/g, "");
  if (!projectId) return NextResponse.json({ error: "Firebase is not configured." }, { status: 503 });

  const { path } = await params;
  const upstream = new URL(`https://${projectId}.firebaseapp.com/__/auth/${path.join("/")}`);
  upstream.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.set("host", `${projectId}.firebaseapp.com`);
  headers.delete("cookie");
  headers.delete("content-length");

  const response = await fetch(upstream, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    redirect: "manual",
    cache: "no-store"
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.set("cache-control", "no-store");
  const location = responseHeaders.get("location");
  if (location) {
    responseHeaders.set("location", location.replace(`https://${projectId}.firebaseapp.com`, request.nextUrl.origin));
  }

  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders
  });
}

export const GET = proxyFirebaseAuth;
export const POST = proxyFirebaseAuth;

