"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Pause, Play, Zap, Layers, ArrowRight } from "lucide-react";
import { useWebsite } from "./website-provider";
import { websiteCards, websiteImage, websiteLogos } from "@/lib/website";

export function BrandShowcase() {
  const s = useWebsite();
  const logos = websiteLogos(s.design_brand_logos).filter((logo) => logo.visible);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    const visibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  const animated = s.design_brand_motion_enabled !== "0" && logos.length > 1;
  const cards = websiteCards(s, "design_sbm_materials");
  return <>
    {s.design_brand_strip_enabled !== "0" && logos.length > 0 && <section ref={ref} className="brand-showcase" aria-label={s.design_brand_strip_heading || "Our brand collection"}>
      <div className="brand-strip-heading"><div><p className="eyebrow">{s.design_brand_strip_eyebrow}</p><h2>{s.design_brand_strip_heading}</h2></div>
        <button className="brand-pause" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} disabled={!animated} aria-label={paused ? "Play brand carousel" : "Pause brand carousel"}>{paused ? <Play size={15} /> : <Pause size={15} />}<span>{paused ? "Play" : "Pause"}</span></button>
      </div>
      <div className="brand-marquee" data-animated={animated} data-paused={paused || hidden || !inView} style={{ "--brand-duration": `${Math.max(30, Math.min(600, Number(s.design_brand_scroll_seconds) || 220))}s` } as CSSProperties}>
        <div className="brand-track">{[0, 1].map((copy) => <ul className="brand-logo-set" key={copy} aria-hidden={copy === 1 ? true : undefined}>{logos.map((logo, index) => <li className={index === 0 ? "brand-logo brand-logo-first" : "brand-logo"} key={`${index}-${logo.image}`}><img src={websiteImage(logo.image)} alt={copy ? "" : logo.name} width={170} height={72} loading="lazy" decoding="async" /></li>)}</ul>)}</div>
      </div>
      <p className="brand-strip-note">{s.design_brand_strip_note}</p>
    </section>}
    {s.design_sbm_enabled !== "0" && <section className="sbm-feature section-wrap" aria-labelledby="sbm-heading">
      <div className="sbm-identity"><span className="sbm-overline">{s.design_sbm_badge}</span><div className="sbm-logo-card"><img src={websiteImage(s.design_sbm_logo, "/images/brands/sbm.svg")} alt="SBM" width={513} height={180} loading="lazy" decoding="async" /></div><div className="sbm-identity-bottom"><span>{s.design_sbm_signature}</span><ArrowUpRight size={28} strokeWidth={1} /></div></div>
      <div className="sbm-copy"><p className="eyebrow">{s.design_sbm_eyebrow}</p><h2 id="sbm-heading">{s.design_sbm_heading}</h2><p className="sbm-description">{s.design_sbm_description}</p><div className="sbm-materials">{cards.map((card, i) => { const Icon = i % 2 ? Layers : Zap; return <article key={i}><Icon size={22} strokeWidth={1.4} /><div><h3>{card.title}</h3><p>{card.body}</p></div></article>; })}</div><Link className="text-link" href={s.design_sbm_cta_href || "/request-quote"}>{s.design_sbm_cta_label}<ArrowRight size={17} /></Link><small>{s.design_sbm_note}</small></div>
    </section>}
  </>;
}
