"use client";

export async function uploadConvertedVideo(jobId, blob) {
  const signatureResponse = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId })
  });
  const signed = await signatureResponse.json();
  if (!signatureResponse.ok) throw new Error(signed.error || "Cloud upload is unavailable.");

  const body = new FormData();
  body.set("file", blob, `${jobId}.mp4`);
  body.set("api_key", signed.apiKey);
  body.set("timestamp", String(signed.timestamp));
  body.set("signature", signed.signature);
  body.set("folder", signed.folder);
  body.set("public_id", signed.publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/video/upload`, { method: "POST", body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Cloud upload failed.");
  return { url: result.secure_url, publicId: result.public_id, bytes: result.bytes };
}

export async function deleteCloudVideo(publicId) {
  const response = await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Cloud video could not be deleted.");
}
