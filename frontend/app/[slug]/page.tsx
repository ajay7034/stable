import { WebsiteCopy } from "@/components/website-copy";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
import { whatsappLink, websiteCards, websiteImage } from "@/lib/website";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { QuoteList } from "@/components/quote-list";
import { api, apiPage, RecordData, ApiError } from "@/lib/api";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Search,
  Check,
} from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";
import { Breadcrumbs, FAQs } from "@/components/seo-blocks";
import { RichText } from "@/components/rich-text";
import { Pagination } from "@/components/pagination";
import { MaterialVisual } from "@/components/material-visual";
import { contentMetadata } from "@/lib/seo";
type Query = { q?: string; page?: string; category?: string };
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Query>;
}) {
  const { slug } = await params,
    q = await searchParams;
  if (["blogs", "careers"].includes(slug))
    return {
      title: slug === "blogs" ? "The Stable Journal" : "Careers at Stable",
      alternates: { canonical: "/" + slug },
      robots: q.q ? { index: false, follow: true } : undefined,
    };
  return contentMetadata("pages", slug, "/" + slug);
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Query>;
}) {
  const { slug } = await params,
    q = await searchParams;
  const s = await api<Record<string, string>>("settings");
  if (["blogs", "careers"].includes(slug)) {
    const result = await apiPage<RecordData>(
      slug +
        "?per_page=9&sort=newest&page=" +
        (q.page || 1) +
        "&q=" +
        encodeURIComponent(q.q || ""),
    );
    return (
      <>
        <PageHero variant={slug === "blogs" ? "materials" : "architecture"} pageKey={slug}>
          <Breadcrumbs
            items={[{ name: slug === "blogs" ? "Journal" : "Careers" }]}
          />
          <p className="eyebrow">
            {slug === "blogs" ? s.design_journal_eyebrow : s.design_careers_eyebrow}
          </p>
          <h1>{slug === "blogs" ? s.blog_heading : s.careers_heading}</h1>
          <p>
            {slug === "blogs" ? s.design_journal_description : s.design_careers_description}
          </p>
        </PageHero>
        <section className="page">
          {slug === "blogs" && (
            <form className="filters">
              <label><WebsiteCopy id="design_copy_ba55a41e941e" fallback={"Search the journal"} /><input
                  name="q"
                  placeholder={s.design_journal_search_placeholder}
                  defaultValue={q.q}
                />
              </label>
              <button>
                <Search size={16} /><WebsiteCopy id="design_copy_890078fbe4b8" fallback={"Search stories"} /></button>
            </form>
          )}
          {result.data.length ? (
            slug === "blogs" ? (
              <div className="journal-grid">
                {result.data.map((r, i) => (
                  <Link
                    className="journal-card"
                    key={r.id}
                    href={"/blogs/" + r.slug}
                  >
                    <div className="journal-art">
                      {r.cover_id ? (
                        <img
                          src={`${basePath}/api/v1/media/` + r.cover_id}
                          alt={r.title}
                        />
                      ) : i % 3 === 0 ? (
                        <Image
                          src={`${basePath}/images/architecture.webp`}
                          fill
                          sizes="(max-width:600px) 88vw, 30vw"
                          alt="Architectural concept"
                        />
                      ) : (
                        <MaterialVisual
                          slug={i % 2 ? "ceramics-tiles" : "hardware"}
                          title={r.blog_category || "Materials"}
                        />
                      )}
                      <span className="journal-tag">
                        {r.blog_category || "Materials"}
                      </span>
                    </div>
                    <p className="article-meta">
                      {r.published_at?.slice(0, 10)} · STABLE JOURNAL
                    </p>
                    <h3>{r.title}</h3>
                    <p>{r.description}</p>
                    <span className="text-link"><WebsiteCopy id="design_copy_ee3757415ed4" fallback={"Read the story"} /><ArrowUpRight size={16} />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="jobs-list">
                {result.data.map((r) => (
                  <Link
                    className="job-card"
                    key={r.id}
                    href={"/careers/" + r.slug}
                  >
                    <div>
                      <p className="eyebrow">{r.department || "STABLE TEAM"}</p>
                      <h2>{r.title}</h2>
                      <p>
                        {r.location || "Ajman, UAE"}
                        {r.employment_type ? " · " + r.employment_type : ""}
                      </p>
                    </div>
                    <ArrowUpRight size={25} />
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="empty">
              <p className="eyebrow"><WebsiteCopy id="design_copy_2ac201727bb5" fallback={"STAY CONNECTED"} /></p>
              <h2>
                {slug === "careers"
                  ? "No current openings."
                  : "No stories found."}
              </h2>
              <p>
                {slug === "careers"
                  ? "We don’t have any published vacancies at the moment. Please check back for future opportunities."
                  : "Try another search or visit again for more insights."}
              </p>
              <Link className="text-link" href="/contact"><WebsiteCopy id="design_copy_430b4d0cd231" fallback={"Get in touch"} /><ArrowUpRight size={16} />
              </Link>
            </div>
          )}
          <Pagination path={"/" + slug} query={q} {...result.meta} />
        </section>
      </>
    );
  }
  let page: RecordData;
  try {
    page = await api("pages/" + slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (page.slug !== slug) permanentRedirect("/" + page.slug);
  if (slug === "about")
    return (
      <>
        <PageHero variant="architecture" pageKey="about" imageId={page.cover_id}>
          <Breadcrumbs items={[{ name: "About Stable" }]} />
          <p className="eyebrow">{s.about_eyebrow}</p>
          <h1>{s.about_heading || page.title}</h1>
          <p>{page.description}</p>
        </PageHero>
        <Reveal>
        <section className="intro section-wrap about-intro">
          <div className="intro-image">
            <Image
              src={websiteImage(s.design_about_intro_image, "/images/architecture.webp")} unoptimized={!!s.design_about_intro_image}
              fill
              sizes="(max-width:600px) 88vw, 42vw"
              alt="Conceptual architectural materials and light"
            />
            <div className="image-caption">
              <span>{s.design_about_image_caption}</span>
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="intro-copy">
            <p className="eyebrow">{s.design_about_intro_eyebrow}</p>
            <h2>{page.title}</h2>
            <RichText value={page.body || ""} />
            {s.design_about_support_enabled !== "0" && <div className="about-support">
              <p className="eyebrow">{s.design_about_support_heading}</p>
              <ul>{websiteCards(s, "design_about_support_cards").map((card, index) => <li key={index}><Check size={17} /><span><strong>{card.title}</strong>{card.body}</span></li>)}</ul>
            </div>}
            <Link className="text-link" href={s.design_about_materials_href || "/products"}>
              {s.design_about_materials_label}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
        </Reveal>
        {s.design_about_process_enabled !== "0" && <Reveal>
          <section className="section-wrap about-process">
            <div className="section-heading">
              <div><p className="eyebrow">{s.design_about_process_eyebrow}</p><h2>{s.design_about_process_heading}</h2></div>
              <p>{s.design_about_process_description}</p>
            </div>
            <div className="about-process-grid">{websiteCards(s, "design_about_process_cards").map((card, index) => <article className="about-step" key={index}><span>{String(index + 1).padStart(2, "0")}</span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>
          </section>
        </Reveal>}
        {s.display_director === "1" && (
          <section className="section-wrap values-section">
            <p className="eyebrow">{s.design_leadership_eyebrow}</p>
            <h2>{s.director_name}</h2>
            <p>{s.design_director_role}</p>
            {s.director_phone && (
              <a className="text-link" href={"tel:" + s.director_phone}>
                {s.director_phone}
                <Phone size={16} />
              </a>
            )}
          </section>
        )}
        {s.design_about_cta_enabled !== "0" && <Reveal>
          <section className="procurement section-wrap about-procurement">
            <div className="procurement-content"><p className="eyebrow">{s.design_about_cta_eyebrow}</p><h2>{s.design_about_cta_heading}</h2><p>{s.design_about_cta_body}</p></div>
            <div className="about-enquiry-card"><p className="eyebrow">{s.design_about_enquiry_eyebrow}</p><h3>{s.design_about_enquiry_heading}</h3><p>{s.design_about_enquiry_body}</p><ul>{(s.design_about_enquiry_checklist || "").split("\n").filter(Boolean).map((line, index) => <li key={index}>{line}</li>)}</ul><Link className="button" href={s.design_about_cta_href || "/contact"}>{s.design_about_cta_label}<ArrowUpRight size={17} /></Link></div>
          </section>
        </Reveal>}
        {!!page.faqs?.length && <section className="page"><FAQs items={page.faqs} /></section>}
      </>
    );
  if (slug === "contact" || slug === "request-quote") {
    const quote = slug === "request-quote";
    return (
      <div className={quote ? "quote-page" : ""}>
        <PageHero variant="planning" pageKey={slug} imageId={page.cover_id}>
          <Breadcrumbs
            items={[{ name: quote ? "Request a quote" : "Contact" }]}
          />
          <p className="eyebrow">
            {quote ? s.design_quote_eyebrow : s.design_contact_eyebrow}
          </p>
          <h1>{quote ? s.quote_heading : s.contact_heading}</h1>
          <p>{page.description}</p>
        </PageHero>
        <div className="contact-grid">
          <aside className="contact-details">
            {quote ? (
              <>
                <p className="eyebrow"><WebsiteCopy id="design_copy_ebfe4fe678aa" fallback={"YOUR REQUIREMENTS"} /></p>
                <QuoteList />
                <div className="product-detail-section">
                  <h3><WebsiteCopy id="design_copy_2cf17a249f5b" fallback={"A little detail goes a long way."} /></h3>
                  <p><WebsiteCopy id="design_copy_2b0079b28705" fallback={"Include quantities, dimensions and your required date. You can attach a PDF bill of quantities or material list."} /></p>
                  <p><WebsiteCopy id="design_copy_e70f390383c8" fallback={"Our team will confirm specifications, pricing and availability."} /></p>
                </div>
              </>
            ) : (
              <>
                <h2>{s.design_contact_panel_heading}</h2>
                <article>
                  <span><WebsiteCopy id="design_copy_bff57c623c5c" fallback={"Visit us"} /></span>
                  <p>{s.address}</p>
                  {s.maps_url && (
                    <a className="text-link" href={s.maps_url}>
                      <MapPin size={15} /><WebsiteCopy id="design_copy_4130d9d5190e" fallback={"Open location"} /><ArrowUpRight size={15} />
                    </a>
                  )}
                </article>
                <article>
                  <span><WebsiteCopy id="design_copy_abd0a0830ee6" fallback={"Call the team"} /></span>
                  <a href={"tel:" + s.phone}>{s.phone}</a>
                  {s.design_contact_secondary_phone && <a className="secondary-phone" href={"tel:" + s.design_contact_secondary_phone.replace(/[^+\d]/g, "")}>{s.design_contact_secondary_phone}</a>}
                </article>
                <article>
                  <span><WebsiteCopy id="design_copy_c553ba2c305c" fallback={"Send an email"} /></span>
                  <a href={"mailto:" + s.email}>{s.email}</a>
                </article>
                {s.business_hours && (
                  <article>
                    <span><WebsiteCopy id="design_copy_866cc922e661" fallback={"Opening hours"} /></span>
                    <p>{s.business_hours}</p>
                  </article>
                )}
              </>
            )}
            <article>
              <span><WebsiteCopy id="design_copy_cb62ddabe21d" fallback={"Prefer a quick message?"} /></span>
              <a
                className="text-link"
                href={
                  whatsappLink(s)
                }
              ><WebsiteCopy id="design_copy_5aa9f5b9bc31" fallback={"Chat on WhatsApp"} /><ArrowUpRight size={16} />
              </a>
            </article>
          </aside>
          <div className="contact-form-panel">
            <p className="eyebrow">
              {quote ? s.design_quote_form_eyebrow : s.design_contact_form_eyebrow}
            </p>
            <h2>
              {quote ? s.design_quote_form_heading : s.design_contact_form_heading}
            </h2>
            <InquiryForm
              type={quote ? "quotes" : "contact"}
              category={typeof q.category === "string" ? q.category : ""}
            />
          </div>
        </div>
        <section style={{ padding: "0 7% 60px" }}>
          <FAQs items={page.faqs || []} />
        </section>
      </div>
    );
  }
  return (
    <>
      <PageHero pageKey={slug} imageId={page.cover_id}><Breadcrumbs items={[{ name: page.title }]} /><p className="eyebrow"><WebsiteCopy id="design_copy_ffb78aaaea76" fallback={"STABLE / INFORMATION"} /></p><h1>{page.title}</h1><p>{page.description}</p></PageHero>
      <section className="page"><RichText value={page.body || ""} /><FAQs items={page.faqs || []} /></section>
    </>
  );
}
