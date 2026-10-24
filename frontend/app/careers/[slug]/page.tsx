import { ApplicationForm } from "@/components/application-form";
import { api, RecordData, ApiError } from "@/lib/api";
import { notFound, permanentRedirect } from "next/navigation";
import { contentMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo-blocks";
import { RichText } from "@/components/rich-text";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return contentMetadata("careers", slug, "/careers/" + slug);
}
export default async function Job({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let p: RecordData;
  try {
    p = await api("careers/" + slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (p.slug !== slug) permanentRedirect("/careers/" + p.slug);
  return (
    <>
      <section className="page-hero">
        <Breadcrumbs
          items={[{ name: "Careers", href: "/careers" }, { name: p.title }]}
        />
        <p className="eyebrow">{p.department || "JOIN THE STABLE TEAM"}</p>
        <h1>{p.title}</h1>
        <p>{p.description}</p>
        <div className="article-meta-large">
          <span>{p.location || "Ajman, UAE"}</span>
          {p.employment_type && <span>{p.employment_type}</span>}
        </div>
      </section>
      <section className="contact-grid">
        <div>
          <p className="eyebrow">ABOUT THIS OPPORTUNITY</p>
          <RichText value={p.body || ""} />
        </div>
        <ApplicationForm job={p.id} />
      </section>
    </>
  );
}
