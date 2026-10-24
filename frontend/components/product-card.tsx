import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { RecordData } from "@/lib/api";
import { MaterialVisual } from "./material-visual";
export function ProductCard({
  product: p,
  category,
}: {
  product: RecordData;
  category?: RecordData;
}) {
  return (
    <Link className="category-card" href={"/products/" + p.slug}>
      <div className="category-image">
        <MaterialVisual
          slug={category?.slug || "hardware"}
          title={p.title}
          cover={p.cover_id}
        />
        <span className="category-arrow">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="category-info">
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          {category?.title || "Materials"}
        </p>
        <h3>{p.title}</h3>
        <span>{p.product_code || "Enquire for specifications"}</span>
      </div>
    </Link>
  );
}
