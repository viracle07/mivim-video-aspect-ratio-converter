export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const updatedAt = new Date();
  return [
    { url: baseUrl, lastModified: updatedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/privacy`, lastModified: updatedAt, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: updatedAt, changeFrequency: "yearly", priority: 0.2 }
  ];
}
