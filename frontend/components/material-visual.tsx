const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
import Image from "next/image";
const slots: Record<string, number> = {
  hardware: 0,
  "power-tools": 1,
  "plumbing-materials": 2,
  "sanitary-ware": 3,
  "ceramics-tiles": 4,
  "electrical-materials": 5,
  "cement-products": 6,
  "waterproofing-materials": 7,
};
export function MaterialVisual({
  slug,
  title,
  cover,
  className = "",
}: {
  slug: string;
  title: string;
  cover?: unknown;
  className?: string;
}) {
  return (
    <div className={"material-visual " + className}>
      {cover ? (
        <img src={`${basePath}/api/v1/media/` + cover} alt={title} loading="lazy" />
      ) : (
        <Image
          src={`${basePath}/images/` + (slug in slots ? slug : "hardware") + ".webp"}
          alt={"Illustrative " + title.toLowerCase()}
          fill
          sizes="(max-width:600px) 45vw, (max-width:1100px) 30vw, 25vw"
        />
      )}
    </div>
  );
}
