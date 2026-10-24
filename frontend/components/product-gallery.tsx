"use client";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

import { useState } from "react";
import { MaterialVisual } from "./material-visual";
export function ProductGallery({
  title,
  images,
  category,
}: {
  title: string;
  images: { media_id: number; alt: string }[];
  category: string;
}) {
  const [selected, setSelected] = useState(0);
  if (!images.length)
    return (
      <div style={{ height: 420 }}>
        <MaterialVisual slug={category} title={title} />
      </div>
    );
  return (
    <div className="product-gallery">
      <img
        src={`${basePath}/api/v1/media/` + images[selected].media_id}
        alt={images[selected].alt || title}
      />
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              aria-label={"View image " + (i + 1)}
              aria-pressed={i === selected}
            >
              <img
                src={`${basePath}/api/v1/media/` + img.media_id + "?size=thumb"}
                alt=""
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
