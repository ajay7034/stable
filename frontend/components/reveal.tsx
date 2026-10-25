"use client";
import { useEffect, useRef } from "react";
import { useWebsite } from "@/components/website-provider";

export function Reveal({ children }: { children: React.ReactNode }) {
  const settings = useWebsite();
  const enabled = settings.design_scroll_animations_enabled !== "0";
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (!enabled || !element || preference.matches || !("IntersectionObserver" in window)) return;
    // Observe individual pieces, including cards below the first row, rather than
    // revealing an entire tall section when its first few pixels enter the screen.
    const pieces = Array.from(element.querySelectorAll<HTMLElement>(
      ".intro-image, .intro-copy, .section-heading, .category-card, .values-grid > article, .procurement-content, .procurement-art, .journal-card, .about-step, .about-enquiry-card",
    ));
    const targets = pieces.length ? pieces : [element];
    targets.forEach((target) => {
      const siblings = target.parentElement ? Array.from(target.parentElement.children) : [];
      const stagger = target.matches(".category-card, .values-grid > article, .journal-card, .about-step") ? siblings.indexOf(target) % 4 : 0;
      target.style.setProperty("--reveal-delay", `${stagger * 85}ms`);
      target.classList.add("reveal-ready");
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -36px 0px" });
    targets.forEach((target) => observer.observe(target));
    const showAll = () => {
      if (preference.matches) {
        targets.forEach((target) => target.classList.add("reveal-visible"));
        observer.disconnect();
      }
    };
    preference.addEventListener("change", showAll);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", showAll);
      targets.forEach((target) => { target.classList.remove("reveal-ready", "reveal-visible"); target.style.removeProperty("--reveal-delay"); });
    };
  }, [enabled]);
  return <div ref={ref}>{children}</div>;
}
