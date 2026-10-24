import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/inter/latin-400.css";
import "./globals.css";
import { api, RecordData } from "@/lib/api";
import { SiteShell } from "@/components/site-shell";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: {
    default: "Stable | Building Materials, Ajman",
    template: "%s | Stable",
  },
  description: "Wholesale and retail building materials in Al Jurf, Ajman.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  let s: Record<string, string> = {},
    categories: RecordData[] = [],
    menu: { id: number; label: string; href: string; group_name: string }[] =
      [],
    pages: RecordData[] = [];
  try {
    [s, categories, menu, pages] = await Promise.all([
      api<Record<string, string>>("settings"),
      api<RecordData[]>("categories?per_page=100"),
      api<{ id: number; label: string; href: string; group_name: string }[]>(
        "navigation",
      ),
      api<RecordData[]>("pages?per_page=100"),
    ]);
  } catch {}
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: s.company_name,
    telephone: s.phone,
    email: s.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address,
      addressLocality: "Ajman",
      addressCountry: "AE",
    },
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
        <SiteShell
          settings={s}
          categories={categories}
          menu={menu}
          legal={pages.filter((p) =>
            ["privacy-policy", "terms-and-conditions"].includes(p.slug),
          )}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
