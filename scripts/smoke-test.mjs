const baseUrl = process.env.MIVIM_TEST_URL || "http://localhost:3000";

async function check(name, path, expectedStatus, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
  if (response.status !== expectedStatus) throw new Error(`${name}: expected ${expectedStatus}, received ${response.status}`);
  console.log(`PASS ${name}`);
  return response;
}

await check("home page", "/", 200);
const ffmpegJavaScript = await check("FFmpeg JavaScript runtime", "/api/ffmpeg-core/ffmpeg-core.js", 200);
if (!ffmpegJavaScript.headers.get("content-type")?.includes("text/javascript")) throw new Error("FFmpeg JavaScript runtime returned the wrong content type");
const ffmpegWasm = await check("FFmpeg WebAssembly runtime", "/api/ffmpeg-core/ffmpeg-core.wasm", 200);
if (!ffmpegWasm.headers.get("content-type")?.includes("application/wasm")) throw new Error("FFmpeg WebAssembly runtime returned the wrong content type");
await check("Paystack status", "/api/paystack/status", 200);
await check("protected dashboard", "/dashboard", 307);
await check("protected conversion API", "/api/convert", 401, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
await check("unsigned Paystack webhook", "/api/paystack/webhook", 401, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
await check("cross-origin session", "/api/auth/session", 403, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://example.invalid" }, body: JSON.stringify({ email: "smoke@example.com", uid: "smoke-user" }) });

console.log("MiVim smoke tests passed.");
