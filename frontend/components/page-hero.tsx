import Image from "next/image";
import { api } from "@/lib/api";
import { websiteImage } from "@/lib/website";
import type { ReactNode } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const backgrounds = {
  architecture: "hero-about.jpg",
  materials: "hero-journal.jpg",
  planning: "hero-planning.jpg",
};

export async function PageHero({ children, variant = "architecture", pageKey, imageId }: {
  children: ReactNode;
  pageKey?: string;
  imageId?: unknown;
  variant?: keyof typeof backgrounds;
}) {
  const settings = await api<Record<string, string>>("settings");
  const keys: Record<string, string> = { about: "about", blogs: "journal", products: "catalogue", contact: "contact", "request-quote": "quote", careers: "careers" };
  const group = pageKey ? (keys[pageKey] || "default") : variant === "materials" ? "catalogue" : variant === "planning" ? "contact" : "default";
  const source = websiteImage(imageId ? String(imageId) : settings[`design_hero_${group}_image`], `/images/${backgrounds[variant]}`);
  return (
    <section className={`page-hero inner-hero inner-hero-${variant}`} data-zoom={settings.design_inner_hero_zoom_enabled !== "0"}>
      <div className="inner-hero-background" aria-hidden="true">
        <Image src={source} unoptimized={source.includes("/api/")} alt="" fill sizes="100vw" preload />
      </div>
      <div className="inner-hero-shade" aria-hidden="true" />
      <div className="inner-hero-content">{children}</div>
      <span className="inner-hero-signature" aria-hidden="true">{settings.design_hero_signature}</span>
    </section>
  );
}
