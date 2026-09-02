const baseUrl = process.env.MIVIM_TEST_URL || "http://localhost:3000";

async function check(name, path, expectedStatus, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
  if (response.status !== expectedStatus) throw new Error(`${name}: expected ${expectedStatus}, received ${response.status}`);
  console.log(`PASS ${name}`);
  return response;
}

await check("home page", "/", 200);
await check("Paystack status", "/api/paystack/status", 200);
await check("protected dashboard", "/dashboard", 307);
await check("protected conversion API", "/api/convert", 401, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
await check("unsigned Paystack webhook", "/api/paystack/webhook", 401, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
await check("cross-origin session", "/api/auth/session", 403, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://example.invalid" }, body: JSON.stringify({ email: "smoke@example.com", uid: "smoke-user" }) });

console.log("MiVim smoke tests passed.");
