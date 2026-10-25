"use client";
import Image from "next/image";
import { useWebsite } from "@/components/website-provider";
import { websiteImage } from "@/lib/website";
import type { CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";


export function HeroSlideshow({ coverId }: { coverId?: number | null }) {
  const settings = useWebsite();
  const interval = Number(settings.design_home_slider_interval || 3200);
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [secondReady, setSecondReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [interaction, setInteraction] = useState(false);
  const playing = settings.design_home_slider_enabled !== "0" && secondReady && !paused && !reduced && inView && pageVisible && !interaction;

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduced(preference.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    return () => {
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActive((slide) => (slide + 1) % 2), interval);
    return () => window.clearInterval(timer);
  }, [playing, active, interval]);

  const slides = [
    { src: websiteImage(settings.design_home_slide_1_image || (coverId ? String(coverId) : ""), "/images/architecture.webp"), alt: settings.design_home_slide_1_alt || "Architectural illustration" },
    { src: websiteImage(settings.design_home_slide_2_image, "/images/hero-architecture-v2.jpg"), alt: settings.design_home_slide_2_alt || "Architectural illustration" },
  ];

  return (
    <div ref={root} className="hero-slideshow" style={{ "--hero-slide-duration": `${interval}ms` } as CSSProperties} data-playing={playing} role="group" aria-roledescription="carousel" aria-label="Architectural inspiration">
      <div className="hero-slides" aria-live="off">
        {slides.map((slide, index) => (
          <div key={slide.src} className={`hero-slide${active === index ? " is-active" : ""}`} aria-hidden={active !== index}>
            <Image className="hero-image" src={slide.src} alt={slide.alt} fill sizes="100vw" onLoad={() => { if (index === 1) setSecondReady(true); }} unoptimized={slide.src.includes("/api/")} preload={index === 0} loading={index === 0 ? undefined : "eager"} />
          </div>
        ))}
      </div>
      <div className="hero-slider-controls" onMouseEnter={() => setInteraction(true)} onMouseLeave={() => setInteraction(false)} onFocus={() => setInteraction(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteraction(false); }}>
        <span className="hero-slide-count" aria-live="off">0{active + 1}<span> / 02</span></span>
        <div className="hero-slide-selectors">
          {slides.map((slide, index) => (
            <button key={slide.src} type="button" className="hero-slide-selector" aria-label={`Show architectural image ${index + 1}`} aria-pressed={active === index} disabled={index === 1 && !secondReady} onClick={() => setActive(index)}><span key={`${active}-${index}`} /></button>
          ))}
        </div>
        <button type="button" className="hero-slider-toggle" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play background slideshow" : "Pause background slideshow"} disabled={reduced || settings.design_home_slider_enabled === "0"}>
          {paused || reduced ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
    </div>
  );
}
