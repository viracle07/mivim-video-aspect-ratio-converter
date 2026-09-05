import crypto from "node:crypto";

export function getCloudinaryConfig() {
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: (process.env.CLOUDINARY_FOLDER || "mivim").replace(/^\/+|\/+$/g, "")
  };
}

export function hasCloudinaryConfig() {
  const config = getCloudinaryConfig();
  return Boolean(config.cloudName && config.apiKey && config.apiSecret);
}

export function signCloudinaryParams(params) {
  const { apiSecret } = getCloudinaryConfig();
  if (!apiSecret) throw new Error("Cloudinary is not configured.");
  const payload = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function deleteCloudinaryUserAssets(uid) {
  if (!hasCloudinaryConfig()) return false;
  const config = getCloudinaryConfig();
  const prefix = `${config.folder}/users/${uid}/`;
  const authorization = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/resources/video/upload?prefix=${encodeURIComponent(prefix)}&all=true`, { method: "DELETE", headers: { Authorization: `Basic ${authorization}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Cloud video backups could not be deleted.");
  return true;
}
