import Image from "next/image";
import type { ReactNode } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const backgrounds = {
  architecture: "hero-about.jpg",
  materials: "hero-journal.jpg",
  planning: "hero-planning.jpg",
};

export function PageHero({ children, variant = "architecture" }: {
  children: ReactNode;
  variant?: keyof typeof backgrounds;
}) {
  return (
    <section className={`page-hero inner-hero inner-hero-${variant}`}>
      <div className="inner-hero-background" aria-hidden="true">
        <Image src={`${basePath}/images/${backgrounds[variant]}`} alt="" fill sizes="100vw" preload />
      </div>
      <div className="inner-hero-shade" aria-hidden="true" />
      <div className="inner-hero-content">{children}</div>
      <span className="inner-hero-signature" aria-hidden="true">ALWAYS TRUSTED / STABLE</span>
    </section>
  );
}
