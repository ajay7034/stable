"use client";
import { useEffect, useRef } from "react";
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    if (element.getBoundingClientRect().top < innerHeight) return;
    element.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("reveal-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.06 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}
