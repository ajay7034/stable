"use client";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const interval = 3200;

export function HeroSlideshow({ coverId }: { coverId?: number | null }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [interaction, setInteraction] = useState(false);
  const playing = !paused && !reduced && inView && pageVisible && !interaction;

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
  }, [playing, active]);

  const slides = [
    { src: coverId ? `${basePath}/api/v1/media/${coverId}` : `${basePath}/images/architecture.webp`, alt: "Concrete and stone architecture in warm sunset light" },
    { src: `${basePath}/images/hero-architecture-v2.jpg`, alt: "Illustrative contemporary limestone architecture at golden hour" },
  ];

  return (
    <div ref={root} className="hero-slideshow" data-playing={playing} role="group" aria-roledescription="carousel" aria-label="Architectural inspiration">
      <div className="hero-slides" aria-live="off">
        {slides.map((slide, index) => (
          <div key={slide.src} className={`hero-slide${active === index ? " is-active" : ""}`} aria-hidden={active !== index}>
            <Image className="hero-image" src={slide.src} alt={slide.alt} fill sizes="100vw" unoptimized={index === 0 && !!coverId} preload={index === 0} loading={index === 0 ? undefined : "eager"} />
          </div>
        ))}
      </div>
      <div className="hero-slider-controls" onMouseEnter={() => setInteraction(true)} onMouseLeave={() => setInteraction(false)} onFocus={() => setInteraction(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteraction(false); }}>
        <span className="hero-slide-count" aria-live="off">0{active + 1}<span> / 02</span></span>
        <div className="hero-slide-selectors">
          {slides.map((slide, index) => (
            <button key={slide.src} type="button" className="hero-slide-selector" aria-label={`Show architectural image ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)}><span key={`${active}-${index}`} /></button>
          ))}
        </div>
        <button type="button" className="hero-slider-toggle" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play background slideshow" : "Pause background slideshow"} disabled={reduced}>
          {paused || reduced ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
    </div>
  );
}
