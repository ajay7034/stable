import { allRecords } from "@/lib/api";
export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const groups = await Promise.all(
    ["pages", "categories", "products", "blogs", "careers"].map(allRecords),
  );
  return [
    ...new Set([
      "/",
      "/products",
      "/blogs",
      "/careers",
      ...groups[0].map((r) => (r.slug === "home" ? "/" : "/" + r.slug)),
      ...groups[1].map((r) => "/products/category/" + r.slug),
      ...groups[2].map((r) => "/products/" + r.slug),
      ...groups[3].map((r) => "/blogs/" + r.slug),
      ...groups[4].map((r) => "/careers/" + r.slug),
    ]),
  ].map((path) => ({ url: base + path }));
}
