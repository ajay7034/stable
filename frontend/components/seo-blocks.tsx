import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { FAQ } from "@/lib/api";
export function Schema({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { name: string; href?: string }[];
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        {items.map((item, i) => (
          <span
            key={i}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <ChevronRight size={11} />
            {item.href ? (
              <Link href={item.href}>{item.name}</Link>
            ) : (
              <span aria-current="page">{item.name}</span>
            )}
          </span>
        ))}
      </nav>
      <Schema
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [{ name: "Home", href: "/" }, ...items].map(
            (item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.name,
              ...(item.href ? { item: base + item.href } : {}),
            }),
          ),
        }}
      />
    </>
  );
}
export function FAQs({ items }: { items: FAQ[] }) {
  if (!items?.length) return null;
  return (
    <section className="product-detail-section">
      <p className="eyebrow">A FEW HELPFUL ANSWERS</p>
      <h2>Your questions, considered.</h2>
      <div className="faq-list">
        {items.map((f, i) => (
          <details key={i}>
            <summary>{f.question}</summary>
            <p>{f.answer}</p>
          </details>
        ))}
      </div>
      <Schema
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />
    </section>
  );
}
