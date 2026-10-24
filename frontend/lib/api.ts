export class ApiError extends Error {
  constructor(public status: number) {
    super("Content service unavailable");
  }
}
export type FAQ = { id?: number; question: string; answer: string };
export type RecordData = {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: string;
  body?: string;
  category_id?: number | null;
  parent_id?: number | null;
  cover_id?: number | null;
  featured?: number;
  tags?: string;
  seo_title?: string;
  seo_description?: string;
  published_at?: string;
  created_at?: string;
  author?: string;
  blog_category?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  product_code?: string;
  availability?: string;
  features?: string;
  applications?: string;
  specifications?: string;
  variants?: string;
  specifications_list?: { label: string; value: string }[];
  variants_list?: { label: string; value: string }[];
  gallery?: { media_id: number; alt: string }[];
  datasheet?: { id: number; title: string } | null;
  faqs?: FAQ[];
  sections?: {
    id: number;
    kind: string;
    heading: string;
    eyebrow: string;
    body: string;
    button_label: string;
    button_href: string;
    visible: number;
  }[];
  [key: string]: unknown;
};
export type PageResult<T> = {
  data: T[];
  meta: { total: number; page: number; per_page: number; pages: number };
};
async function response(path: string) {
  const r = await fetch(
    `${process.env.API_ORIGIN || "http://127.0.0.1:8080"}/api/v1/${path}`,
    { cache: "no-store" },
  );
  if (!r.ok) throw new ApiError(r.status);
  return r.json();
}
export async function api<T>(path: string): Promise<T> {
  return (await response(path)).data;
}
export async function apiPage<T>(path: string): Promise<PageResult<T>> {
  return response(path);
}
export async function allRecords(module: string): Promise<RecordData[]> {
  let page = 1,
    records: RecordData[] = [];
  while (page <= 1000) {
    const result = await apiPage<RecordData>(
      `${module}?per_page=100&page=${page}`,
    );
    records.push(...result.data);
    if (page >= result.meta.pages) break;
    page++;
  }
  return records;
}
