import { api, apiPage, RecordData, ApiError } from "@/lib/api";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MaterialVisual } from "@/components/material-visual";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { Breadcrumbs, FAQs } from "@/components/seo-blocks";
import { contentMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return contentMetadata("categories", slug, "/products/category/" + slug);
}
export default async function Category({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params,
    q = await searchParams;
  let c: RecordData;
  try {
    c = await api("categories/" + slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (c.slug !== slug) permanentRedirect("/products/category/" + c.slug);
  const [all, result] = await Promise.all([
    api<RecordData[]>("categories?per_page=100"),
    apiPage<RecordData>(
      `products?category=${c.id}&per_page=12&page=${q.page || 1}`,
    ),
  ]);
  const children = all.filter((r) => r.parent_id === c.id);
  return (
    <>
      <section className="page-hero">
        <Breadcrumbs
          items={[{ name: "Materials", href: "/products" }, { name: c.title }]}
        />
        <p className="eyebrow">THE STABLE MATERIALS COLLECTION</p>
        <h1>{c.title}</h1>
        <p>{c.description}</p>
      </section>
      <section className="page">
        <div className="product-layout">
          <div style={{ maxHeight: 470, aspectRatio: "1/1" }}>
            <MaterialVisual slug={c.slug} title={c.title} cover={c.cover_id} />
          </div>
          <div>
            <p className="eyebrow">YOUR REQUIREMENTS, CONSIDERED</p>
            <h2>
              A practical start
              <br />
              to the right selection.
            </h2>
            <p>
              {c.body ||
                "Share your application, specifications and quantities. Our team can discuss your requirements and confirm the available options."}
            </p>
            <Link className="button" href={"/request-quote?category=" + c.id}>
              Enquire about this category
              <ArrowUpRight size={17} />
            </Link>
            <p className="illustration-note" style={{ textAlign: "left" }}>
              Specific products, specifications and availability are confirmed
              on enquiry.
            </p>
          </div>
        </div>
        {children.length > 0 && (
          <section className="product-detail-section">
            <h2>Explore this category.</h2>
            <div className="category-grid">
              {children.map((r) => (
                <Link
                  className="card"
                  key={r.id}
                  href={"/products/category/" + r.slug}
                >
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </div>
          </section>
        )}
        <section className="product-detail-section">
          <h2>Product listings</h2>
          {result.data.length ? (
            <div className="category-grid">
              {result.data.map((p) => (
                <ProductCard key={p.id} product={p} category={c} />
              ))}
            </div>
          ) : (
            <p className="empty">
              Individual product listings are being verified. Our team welcomes
              enquiries for your material requirements.
            </p>
          )}
          <Pagination
            path={"/products/category/" + slug}
            query={q}
            {...result.meta}
          />
        </section>
        <FAQs items={c.faqs || []} />
        <section className="product-detail-section">
          <h2>Keep exploring.</h2>
          <div className="category-grid">
            {all
              .filter((r) => r.id !== c.id && !r.parent_id)
              .slice(0, 4)
              .map((r) => (
                <Link
                  className="category-card"
                  key={r.id}
                  href={"/products/category/" + r.slug}
                >
                  <div className="category-image">
                    <MaterialVisual
                      slug={r.slug}
                      title={r.title}
                      cover={r.cover_id}
                    />
                  </div>
                  <div className="category-info">
                    <h3>{r.title}</h3>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </section>
    </>
  );
}
