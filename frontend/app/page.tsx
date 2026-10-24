const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Check,
  Layers,
  Handshake,
  Compass,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { api, RecordData } from "@/lib/api";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { Reveal } from "@/components/reveal";
import { MaterialVisual } from "@/components/material-visual";
import { textContent } from "@/components/rich-text";
import { contentMetadata } from "@/lib/seo";
export async function generateMetadata() {
  return contentMetadata("pages", "home", "/");
}
type Section = {
  id: number;
  kind: string;
  heading: string;
  eyebrow: string;
  body: string;
  button_label: string;
  button_href: string;
};
export default async function Home() {
  const [page, categories, settings, blogs] = await Promise.all([
    api<RecordData>("pages/home"),
    api<RecordData[]>("categories?per_page=100"),
    api<Record<string, string>>("settings"),
    api<RecordData[]>("blogs?sort=newest&per_page=3"),
  ]);
  const cats = categories.filter((c) => !c.parent_id);
  const title = page.title.split(" "),
    last = title.pop();
  return (
    <>
      <section className="hero">
        <HeroSlideshow coverId={page.cover_id} />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">
            <span className="tiny-line" />
            {settings.hero_eyebrow}
          </p>
          <h1>
            {title.join(" ")} <span>{last}</span>
          </h1>
          <p className="hero-description">{page.description}</p>
          <div className="actions">
            <Link
              prefetch={false}
              className="button"
              href={settings.hero_primary_href || "/products"}
            >
              {settings.hero_primary_label}
              <ArrowUpRight size={18} />
            </Link>
            <Link
              prefetch={false}
              className="button button-outline"
              href={settings.hero_secondary_href || "/request-quote"}
            >
              {settings.hero_secondary_label}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="hero-foot">
          <span>{settings.hero_location}</span>
          <span>{settings.hero_note}</span>
          <a href="#discover" aria-label="Discover Stable">
            <ArrowDown size={18} />
          </a>
        </div>
        <span className="hero-index">ALWAYS TRUSTED / STABLE</span>
      </section>
      <div className="trust-strip">
        <span>{settings.brand_theme}</span>
        <span>
          <Check size={16} />
          Wholesale & retail
        </span>
        <span>
          <Check size={16} />
          Construction & finishing materials
        </span>
        <span>
          <Check size={16} />
          Based in Ajman, UAE
        </span>
      </div>
      {((page.sections || []) as Section[]).map((section) => (
        <Reveal key={section.id}>
          {section.kind === "intro" ? (
            <section className="intro section-wrap" id="discover">
              <div className="intro-image">
                <Image
                  src={`${basePath}/images/architecture.webp`}
                  alt="Illustrative architectural details in warm light"
                  fill
                  sizes="(max-width:768px) 90vw, 42vw"
                />
                <div className="image-caption">
                  <span>THE DETAILS MAKE THE DIFFERENCE.</span>
                  <ArrowUpRight size={18} />
                </div>
                <div className="intro-seal">
                  <span>STABLE</span>
                  <small>
                    ALWAYS
                    <br />
                    TRUSTED.
                  </small>
                </div>
              </div>
              <div className="intro-copy">
                <p className="eyebrow">{section.eyebrow}</p>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
                <Link className="text-link" href={section.button_href}>
                  {section.button_label}
                  <ArrowUpRight size={17} />
                </Link>
                <div className="intro-signature">
                  <span className="signature-line" />
                  <span>
                    Rooted in Ajman.
                    <br />
                    Focused on your requirements.
                  </span>
                </div>
              </div>
            </section>
          ) : section.kind === "categories" ? (
            <section className="catalogue section-wrap">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{section.eyebrow}</p>
                  <h2>{section.heading}</h2>
                </div>
                <div>
                  <p>{section.body}</p>
                  <Link className="text-link" href={section.button_href}>
                    {section.button_label}
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
              </div>
              <div className="category-grid">
                {cats.map((c, i) => (
                  <Link
                    prefetch={false}
                    className="category-card"
                    key={c.id}
                    href={"/products/category/" + c.slug}
                  >
                    <div className="category-image">
                      <MaterialVisual
                        slug={c.slug}
                        title={c.title}
                        cover={c.cover_id}
                      />
                      <span className="category-index">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="category-arrow">
                        <ArrowUpRight size={21} />
                      </span>
                    </div>
                    <div className="category-info">
                      <h3>{c.title}</h3>
                      <span>
                        Explore materials
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <p className="illustration-note">
                Material imagery is illustrative. Specific products and
                availability are confirmed on enquiry.
              </p>
            </section>
          ) : section.kind === "values" ? (
            <section className="values-section section-wrap">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{section.eyebrow}</p>
                  <h2>{section.heading}</h2>
                </div>
                <Link className="text-link" href={section.button_href}>
                  {section.button_label}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
              <div className="values-grid">
                {section.body
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => {
                    const [heading, ...body] = line.split("|");
                    const Icon = [Handshake, Compass, Layers][i % 3];
                    return (
                      <article key={i}>
                        <span className="value-number">0{i + 1}</span>
                        <Icon strokeWidth={1} size={40} />
                        <h3>{heading}</h3>
                        <p>{body.join("|")}</p>
                      </article>
                    );
                  })}
              </div>
            </section>
          ) : section.kind === "cta" ? (
            <section className="procurement section-wrap">
              <div className="procurement-content">
                <p className="eyebrow">{section.eyebrow}</p>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
                <Link className="button" href={section.button_href}>
                  {section.button_label}
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              <div className="procurement-art">
                <div className="plan-paper">
                  <span>MATERIAL REQUIREMENTS</span>
                  <div className="plan-lines" />
                  <div className="plan-building">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span className="plan-stamp">
                    LET’S GET
                    <br />
                    STARTED.
                  </span>
                </div>
              </div>
            </section>
          ) : section.kind === "journal" ? (
            <section className="journal-section section-wrap">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{section.eyebrow}</p>
                  <h2>{section.heading}</h2>
                </div>
                <Link className="text-link" href={section.button_href}>
                  {section.button_label}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
              <div className="journal-grid">
                {blogs.map((blog, i) => (
                  <Link
                    prefetch={false}
                    className="journal-card"
                    href={"/blogs/" + blog.slug}
                    key={blog.id}
                  >
                    <div className={"journal-art journal-art-" + i}>
                      {!!blog.cover_id ? (
                        <img
                          src={`${basePath}/api/v1/media/` + blog.cover_id}
                          alt={blog.title}
                        />
                      ) : i === 0 ? (
                        <Image
                          src={`${basePath}/images/architecture.webp`}
                          alt="Architectural concept"
                          fill
                          sizes="(max-width:768px) 90vw, 30vw"
                        />
                      ) : (
                        <MaterialVisual
                          slug={i === 1 ? "ceramics-tiles" : "hardware"}
                          title={String(blog.blog_category || "Materials")}
                        />
                      )}
                      <span className="journal-tag">
                        {String(blog.blog_category || "Materials")}
                      </span>
                    </div>
                    <p className="article-meta">
                      STABLE JOURNAL <span>•</span>{" "}
                      {Math.max(
                        1,
                        Math.ceil(
                          textContent(blog.body || "").split(/\s+/).length /
                            200,
                        ),
                      )}{" "}
                      MIN READ
                    </p>
                    <h3>{blog.title}</h3>
                    <span className="text-link">
                      Read the story
                      <ArrowUpRight size={16} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="section-wrap">
              <p className="eyebrow">{section.eyebrow}</p>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
              {section.button_href && (
                <Link className="text-link" href={section.button_href}>
                  {section.button_label}
                  <ArrowUpRight size={17} />
                </Link>
              )}
            </section>
          )}
        </Reveal>
      ))}
    </>
  );
}
