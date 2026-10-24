import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
export function Pagination({
  path,
  query,
  page,
  pages,
  total,
}: {
  path: string;
  query: Record<string, string | undefined>;
  page: number;
  pages: number;
  total: number;
}) {
  if (pages <= 1) return null;
  function href(n: number) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) p.set(k, v);
    p.set("page", String(n));
    return path + "?" + p;
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        {total} results · Page {page} of {pages}
      </span>
      <div className="pagination-links">
        {page > 1 && (
          <Link href={href(page - 1)}>
            <ArrowLeft size={13} className="inline-arrow" /> Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)}>
            Next <ArrowRight size={13} className="inline-arrow" />
          </Link>
        )}
      </div>
    </nav>
  );
}
