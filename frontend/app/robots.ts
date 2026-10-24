const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
export default function robots() {
  return {
    rules: { userAgent: "*", allow: `${basePath}/`, disallow: [`${basePath}/admin`, `${basePath}/api`] },
    sitemap:
      (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") +
      "/sitemap.xml",
  };
}
