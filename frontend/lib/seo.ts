import type { Metadata } from "next";
import { api, RecordData, ApiError } from "./api";
export async function contentMetadata(
  module: string,
  slug: string,
  path: string,
): Promise<Metadata> {
  try {
    const r = await api<RecordData>(module + "/" + slug);
    const title = String(r.seo_title || r.title),
      description = String(r.seo_description || r.description);
    return {
      title,
      description,
      alternates: { canonical: path },
      openGraph: {
        title,
        description,
        url: path,
        type: module === "blogs" ? "article" : "website",
        images: r.cover_id
          ? [{ url: "/api/v1/media/" + r.cover_id, alt: r.title }]
          : [
              {
                url: "/images/architecture.webp",
                alt: "Stable architectural concept",
              },
            ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [
          r.cover_id
            ? "/api/v1/media/" + r.cover_id
            : "/images/architecture.webp",
        ],
      },
    };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404)
      return { title: "Not found", robots: { index: false } };
    throw e;
  }
}
