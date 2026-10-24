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
        <section className="page-hero">
          <Breadcrumbs
            items={[{ name: slug === "blogs" ? "Journal" : "Careers" }]}
          />
          <p className="eyebrow">
            {slug === "blogs"
              ? "THE STABLE JOURNAL"
              : "PEOPLE MAKE THE DIFFERENCE"}
          </p>
          <h1>{slug === "blogs" ? s.blog_heading : s.careers_heading}</h1>
          <p>
            {slug === "blogs"
              ? "Practical thoughts on materials, planning and the details that bring a project together."
              : "Explore opportunities to become part of the Stable team in Ajman."}
          </p>
        </section>
        <section className="page">
          {slug === "blogs" && (
            <form className="filters">
              <label>
                Search the journal
                <input
                  name="q"
                  placeholder="Find a story or topic"
                  defaultValue={q.q}
                />
              </label>
              <button>
                <Search size={16} />
                Search stories
              </button>
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
                          src={"/api/v1/media/" + r.cover_id}
                          alt={r.title}
                        />
                      ) : i % 3 === 0 ? (
                        <Image
                          src="/images/architecture.webp"
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
                    <span className="text-link">
                      Read the story
                      <ArrowUpRight size={16} />
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
              <p className="eyebrow">STAY CONNECTED</p>
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
              <Link className="text-link" href="/contact">
                Get in touch
                <ArrowUpRight size={16} />
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
        <section className="page-hero">
          <Breadcrumbs items={[{ name: "About Stable" }]} />
          <p className="eyebrow">{s.about_eyebrow}</p>
          <h1>{s.about_heading || page.title}</h1>
          <p>{page.description}</p>
        </section>
        <section className="intro section-wrap">
          <div className="intro-image">
            <Image
              src="/images/architecture.webp"
              fill
              sizes="(max-width:600px) 88vw, 42vw"
              alt="Conceptual architectural materials and light"
            />
            <div className="image-caption">
              <span>THE FOUNDATION OF SOMETHING GREAT</span>
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="intro-copy">
            <p className="eyebrow">STABLE BUILDING MATERIALS TRADING LLC</p>
            <h2>{page.title}</h2>
            <RichText value={page.body || ""} />
            <Link className="text-link" href="/products">
              Explore our materials
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
        {s.display_director === "1" && (
          <section className="section-wrap values-section">
            <p className="eyebrow">OUR LEADERSHIP</p>
            <h2>{s.director_name}</h2>
            <p>Managing Director</p>
            {s.director_phone && (
              <a className="text-link" href={"tel:" + s.director_phone}>
                {s.director_phone}
                <Phone size={16} />
              </a>
            )}
          </section>
        )}
        <section className="procurement section-wrap">
          <div>
            <p className="eyebrow">ALWAYS TRUSTED</p>
            <h2>
              Tell us where
              <br />
              you want to begin.
            </h2>
            <p>
              We welcome wholesale and retail enquiries for construction and
              finishing requirements.
            </p>
          </div>
          <Link
            className="button"
            style={{ justifySelf: "start" }}
            href="/contact"
          >
            Start a conversation
            <ArrowUpRight size={17} />
          </Link>
        </section>
        <section className="page">
          <FAQs items={page.faqs || []} />
        </section>
      </>
    );
  if (slug === "contact" || slug === "request-quote") {
    const quote = slug === "request-quote";
    return (
      <div className={quote ? "quote-page" : ""}>
        <section className="page-hero">
          <Breadcrumbs
            items={[{ name: quote ? "Request a quote" : "Contact" }]}
          />
          <p className="eyebrow">
            {quote ? "LET’S GET YOUR PROJECT MOVING" : "RIGHT HERE IN AJMAN"}
          </p>
          <h1>{quote ? s.quote_heading : s.contact_heading}</h1>
          <p>{page.description}</p>
        </section>
        <div className="contact-grid">
          <aside className="contact-details">
            {quote ? (
              <>
                <p className="eyebrow">YOUR REQUIREMENTS</p>
                <QuoteList />
                <div className="product-detail-section">
                  <h3>A little detail goes a long way.</h3>
                  <p>
                    Include quantities, dimensions and your required date. You
                    can attach a PDF bill of quantities or material list.
                  </p>
                  <p>
                    Our team will confirm specifications, pricing and
                    availability.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2>
                  A conversation
                  <br />
                  worth starting.
                </h2>
                <article>
                  <span>Visit us</span>
                  <p>{s.address}</p>
                  {s.maps_url && (
                    <a className="text-link" href={s.maps_url}>
                      <MapPin size={15} />
                      Open location
                      <ArrowUpRight size={15} />
                    </a>
                  )}
                </article>
                <article>
                  <span>Call the team</span>
                  <a href={"tel:" + s.phone}>{s.phone}</a>
                </article>
                <article>
                  <span>Send an email</span>
                  <a href={"mailto:" + s.email}>{s.email}</a>
                </article>
                {s.business_hours && (
                  <article>
                    <span>Opening hours</span>
                    <p>{s.business_hours}</p>
                  </article>
                )}
              </>
            )}
            <article>
              <span>Prefer a quick message?</span>
              <a
                className="text-link"
                href={
                  "https://wa.me/" +
                  (s.whatsapp || "971525463574").replace(/\D/g, "")
                }
              >
                Chat on WhatsApp
                <ArrowUpRight size={16} />
              </a>
            </article>
          </aside>
          <div className="contact-form-panel">
            <p className="eyebrow">
              {quote ? "REQUEST A QUOTATION" : "SEND AN ENQUIRY"}
            </p>
            <h2>
              {quote ? "Share your material list." : "What can we help with?"}
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
    <section className="page">
      <Breadcrumbs items={[{ name: page.title }]} />
      <p className="eyebrow">STABLE / INFORMATION</p>
      <h1>{page.title}</h1>
      <p>{page.description}</p>
      <RichText value={page.body || ""} />
      <FAQs items={page.faqs || []} />
    </section>
  );
}
