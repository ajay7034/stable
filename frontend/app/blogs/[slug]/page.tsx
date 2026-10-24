import { PageHero } from "@/components/page-hero";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
import { api, RecordData, ApiError } from "@/lib/api";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { contentMetadata } from "@/lib/seo";
import { RichText, headings, textContent } from "@/components/rich-text";
import { Breadcrumbs, FAQs, Schema } from "@/components/seo-blocks";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return contentMetadata("blogs", slug, "/blogs/" + slug);
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let p: RecordData;
  try {
    p = await api("blogs/" + slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (p.slug !== slug) permanentRedirect("/blogs/" + p.slug);
  const related = await api<RecordData[]>("blogs?per_page=4&sort=newest"),
    toc = headings(p.body || ""),
    reading = Math.max(
      1,
      Math.ceil(textContent(p.body || "").split(/\s+/).length / 200),
    ),
    base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return (
    <>
      <PageHero variant="materials">
        <Breadcrumbs
          items={[{ name: "Journal", href: "/blogs" }, { name: p.title }]}
        />
        <p className="eyebrow">{p.blog_category || "STABLE JOURNAL"}</p>
        <h1>{p.title}</h1>
        <p>{p.description}</p>
        <div className="article-meta-large">
          <span>{p.author || "Stable team"}</span>
          <span>{p.published_at?.slice(0, 10)}</span>
          <span>{reading} min read</span>
        </div>
      </PageHero>
      <div style={{ height: 390, position: "relative", overflow: "hidden" }}>
        {p.cover_id ? (
          <img
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            src={`${basePath}/api/v1/media/` + p.cover_id}
            alt={p.title}
          />
        ) : (
          <Image
            src={`${basePath}/images/architecture.webp`}
            fill
            sizes="100vw"
            alt="Architectural concept illustrating material detail"
            style={{ objectFit: "cover", objectPosition: "50% 60%" }}
          />
        )}
      </div>
      <div className="article-layout">
        <aside className="article-aside">
          <p className="eyebrow">IN THIS STORY</p>
          {toc.map((h) => (
            <a href={"#" + h.id} key={h.id}>
              {h.text}
            </a>
          ))}
          <div
            style={{
              borderTop: "1px solid var(--line)",
              marginTop: 25,
              paddingTop: 20,
            }}
          >
            <p className="eyebrow">SHARE THIS STORY</p>
            <a
              href={
                "https://wa.me/?text=" +
                encodeURIComponent(p.title + " " + base + "/blogs/" + p.slug)
              }
            >
              WhatsApp
              <ArrowUpRight size={12} className="inline-arrow" />
            </a>
            <a
              href={
                "mailto:?subject=" +
                encodeURIComponent(p.title) +
                "&body=" +
                encodeURIComponent(base + "/blogs/" + p.slug)
              }
            >
              Email
              <ArrowUpRight size={12} className="inline-arrow" />
            </a>
          </div>
        </aside>
        <article className="article-content">
          <RichText value={p.body || ""} />
          <FAQs items={p.faqs || []} />
          <div className="empty" style={{ marginTop: 40 }}>
            <h3>Planning your materials?</h3>
            <p>Our team is here to discuss your requirements.</p>
            <Link className="text-link" href="/request-quote">
              Request a quotation
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </article>
      </div>
      {related.some((r) => r.id !== p.id) && (
        <section className="section-wrap" style={{ background: "var(--soft)" }}>
          <p className="eyebrow">KEEP EXPLORING</p>
          <h2>More from the journal.</h2>
          <div className="journal-grid">
            {related
              .filter((r) => r.id !== p.id)
              .slice(0, 3)
              .map((r) => (
                <Link className="card" key={r.id} href={"/blogs/" + r.slug}>
                  <p className="eyebrow">{r.blog_category}</p>
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
          </div>
        </section>
      )}
      <Schema
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: p.title,
          description: p.description,
          datePublished: p.published_at?.replace(" ", "T") + "Z",
          author: {
            "@type": "Organization",
            name: "STABLE BUILDING MATERIALS TRADING LLC",
          },
          mainEntityOfPage: base + "/blogs/" + p.slug,
        }}
      />
    </>
  );
}
