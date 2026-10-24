import { PageHero } from "@/components/page-hero";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
import { api, RecordData, ApiError } from "@/lib/api";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Download, MessageCircle } from "lucide-react";
import { QuoteList } from "@/components/quote-list";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { Breadcrumbs, FAQs, Schema } from "@/components/seo-blocks";
import { RichText } from "@/components/rich-text";
import { contentMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return contentMetadata("products", slug, "/products/" + slug);
}
export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let p: RecordData;
  try {
    p = await api("products/" + slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (p.slug !== slug) permanentRedirect("/products/" + p.slug);
  const [categories, related, s] = await Promise.all([
    api<RecordData[]>("categories?per_page=100"),
    api<RecordData[]>(
      "products?category=" + (p.category_id || "") + "&per_page=5",
    ),
    api<Record<string, string>>("settings"),
  ]);
  const c = categories.find((r) => r.id === p.category_id);
  const images = [
    ...(p.cover_id ? [{ media_id: p.cover_id, alt: p.title }] : []),
    ...(p.gallery || []),
  ].filter(
    (img, i, list) => list.findIndex((r) => r.media_id === img.media_id) === i,
  );
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return (
    <>
    <PageHero variant="materials">
      <Breadcrumbs
        items={[
          { name: "Materials", href: "/products" },
          ...(c
            ? [{ name: c.title, href: "/products/category/" + c.slug }]
            : []),
          { name: p.title },
        ]}
      />
      <p className="eyebrow">{c?.title || "STABLE MATERIALS"}</p><h1>{p.title}</h1><p>{p.description}</p>
    </PageHero>
    <section className="page">
      <div className="product-layout">
        <ProductGallery
          title={p.title}
          images={images}
          category={c?.slug || "hardware"}
        />
        <div>
          <p className="eyebrow">{c?.title || "STABLE MATERIALS"}</p>
          <h2>Material details.</h2>
          {p.product_code && (
            <p className="article-meta">REFERENCE: {p.product_code}</p>
          )}
          <p className="status-pill">
            {p.availability === "available"
              ? "Available — confirm quantities"
              : p.availability === "unavailable"
                ? "Currently unavailable"
                : "Availability on enquiry"}
          </p>
          <div className="actions">
            <QuoteList product={{ id: p.id, title: p.title }} />
            <Link className="text-link" href="/request-quote">
              Review quote list
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p style={{ fontSize: 11, marginTop: 22 }}>
            Final pricing and availability are confirmed by the team.
          </p>
          <a
            className="text-link"
            href={
              "https://wa.me/" +
              (s.whatsapp || "971525463574").replace(/\D/g, "") +
              "?text=" +
              encodeURIComponent(
                "Hello Stable, I would like to enquire about " +
                  p.title +
                  (p.product_code ? " (" + p.product_code + ")" : "") +
                  ".",
              )
            }
          >
            <MessageCircle size={16} />
            Enquire on WhatsApp
            <ArrowUpRight size={16} />
          </a>
          {p.datasheet && (
            <p style={{ marginTop: 22 }}>
              <a
                className="text-link"
                href={`${basePath}/api/v1/documents/` + p.datasheet.id}
              >
                <Download size={16} />
                Download datasheet
              </a>
            </p>
          )}
        </div>
      </div>
      {p.body && (
        <section className="product-detail-section">
          <h2>About this material</h2>
          <RichText value={p.body} />
        </section>
      )}
      {(["features", "applications"] as const).map((k) =>
        p[k] ? (
          <section className="product-detail-section" key={k}>
            <h2>
              {k === "features" ? "Details that matter." : "Where it fits."}
            </h2>
            <RichText value={p[k] || ""} />
          </section>
        ) : null,
      )}
      {(["specifications", "variants"] as const).map((k) =>
        p[k + "_list"] && (p[k + "_list"] as unknown[])?.length > 0 ? (
          <section className="product-detail-section" key={k}>
            <h2>
              {k === "specifications"
                ? "Technical specifications"
                : "Sizes & variants"}
            </h2>
            <table className="spec-table">
              <tbody>
                {(p[k + "_list"] as { label: string; value: string }[]).map(
                  (r, i) => (
                    <tr key={i}>
                      <th scope="row">{r.label}</th>
                      <td>{r.value}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </section>
        ) : p[k] ? (
          <section className="product-detail-section" key={k}>
            <h2>{k}</h2>
            <RichText value={p[k] || ""} />
          </section>
        ) : null,
      )}
      <FAQs items={p.faqs || []} />
      {related.some((r) => r.id !== p.id) && (
        <section className="product-detail-section">
          <h2>Related materials</h2>
          <div className="category-grid">
            {related
              .filter((r) => r.id !== p.id)
              .slice(0, 4)
              .map((r) => (
                <ProductCard key={r.id} product={r} category={c} />
              ))}
          </div>
        </section>
      )}
      <Schema
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.title,
          description: p.description,
          url: base + "/products/" + p.slug,
          ...(p.product_code ? { sku: p.product_code } : {}),
          ...(images.length
            ? { image: images.map((i) => base + "/api/v1/media/" + i.media_id) }
            : {}),
        }}
      />
    </section>
    </>
  );
}
