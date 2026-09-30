export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms"],
      disallow: ["/dashboard/", "/login", "/signup", "/admin-login", "/reset-password", "/verify-email", "/api/"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
