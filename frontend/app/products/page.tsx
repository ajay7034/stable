import { WebsiteCopy } from "@/components/website-copy";
import { PageHero } from "@/components/page-hero";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { api, apiPage, RecordData } from "@/lib/api";
import { MaterialVisual } from "@/components/material-visual";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { Breadcrumbs } from "@/components/seo-blocks";
type Query = { q?: string; category?: string; sort?: string; page?: string };
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  return {
    title: "Building materials catalogue in Ajman",
    description:
      "Explore hardware, power tools, plumbing, sanitary ware, tiles, electrical, cement and waterproofing materials. Enquire with Stable in Ajman.",
    alternates: { canonical: "/products" },
    robots: q.q ? { index: false, follow: true } : undefined,
  };
}
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  const params = new URLSearchParams(
    Object.entries(q).filter(([, v]) => v !== undefined) as [string, string][],
  );
  params.set("per_page", "12");
  const [categories, result, s] = await Promise.all([
    api<RecordData[]>("categories?per_page=100"),
    apiPage<RecordData>("products?" + params),
    api<Record<string, string>>("settings"),
  ]);
  const roots = categories.filter((c) => !c.parent_id);
  const visible = roots.filter(
    (c) =>
      (!q.q || c.title.toLowerCase().includes(q.q.toLowerCase())) &&
      (!q.category || String(c.id) === q.category),
  );
  return (
    <>
      <PageHero variant="materials" pageKey="products">
        <Breadcrumbs items={[{ name: "Materials" }]} />
        <p className="eyebrow">{s.materials_eyebrow}</p>
        <h1>{s.materials_heading}</h1>
        <p>{s.materials_description}</p>
      </PageHero>
      <section className="page">
        <form className="filters">
          <label><WebsiteCopy id="design_copy_9cb70b803a5a" fallback={"Find a material"} /><input
              name="q"
              placeholder={s.design_catalogue_search_placeholder}
              defaultValue={q.q}
            />
          </label>
          <label><WebsiteCopy id="design_copy_535be3916dcd" fallback={"Supply category"} /><select name="category" defaultValue={q.category || ""}>
              <option value=""><WebsiteCopy id="design_copy_09c3ccf441ea" fallback={"All categories"} /></option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_id ? "— " : ""}
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label><WebsiteCopy id="design_copy_8fe09aa8c0e4" fallback={"Sort by"} /><select name="sort" defaultValue={q.sort || "featured"}>
              <option value="featured"><WebsiteCopy id="design_copy_96f31014e1c2" fallback={"Featured"} /></option>
              <option value="title"><WebsiteCopy id="design_copy_494dee5fc227" fallback={"Name"} /></option>
              <option value="newest"><WebsiteCopy id="design_copy_2151df16302a" fallback={"Newest"} /></option>
            </select>
          </label>
          <button>
            <Search size={16} /><WebsiteCopy id="design_copy_66307fff4d09" fallback={"Find materials"} /></button>
        </form>
        {visible.length > 0 && (
          <>
            <div className="section-heading">
              <h2>
                {q.q || q.category
                  ? "Matching categories"
                  : "Our supply categories"}
              </h2>
              <span className="eyebrow"><WebsiteCopy id="design_copy_846db9851d90" fallback={"WHOLESALE & RETAIL"} /></span>
            </div>
            <div className="category-grid">
              {visible.map((c, i) => (
                <Link
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
                      <ArrowUpRight size={20} />
                    </span>
                  </div>
                  <div className="category-info">
                    <h3>{c.title}</h3>
                    <span><WebsiteCopy id="design_copy_d0aff0ebda20" fallback={"Discover the category"} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
        <div className="section-heading">
          <h2><WebsiteCopy id="design_copy_48fc5761b727" fallback={"Explore the details."} /></h2>
          <p>{result.meta.total} published product listings</p>
        </div>
        {result.data.length ? (
          <div className="category-grid">
            {result.data.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                category={categories.find((c) => c.id === p.category_id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>
              {q.q
                ? "No matching product listings yet."
                : "Tell us what your project needs."}
            </h3>
            <p><WebsiteCopy id="design_copy_7627ac022405" fallback={"Our detailed catalogue is being verified. Send your material list and we’ll help you discuss specifications, pricing and availability."} /></p>
            <Link className="text-link" href="/request-quote"><WebsiteCopy id="design_copy_a1bc1c005785" fallback={"Send your requirements"} /><ArrowUpRight size={16} />
            </Link>
          </div>
        )}
        <Pagination path="/products" query={q} {...result.meta} />
        <p className="illustration-note"><WebsiteCopy id="design_copy_446e88e2c650" fallback={"Material imagery is illustrative. Availability is confirmed on enquiry."} /></p>
      </section>
    </>
  );
}
