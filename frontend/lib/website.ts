import type { CSSProperties } from "react";
export type WebsiteValues = Record<string, string>;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
export function websiteImage(value?: string, fallback = "/logo-transparent.png") {
  return value && /^\d+$/.test(value) ? `${basePath}/api/v1/media/${value}` : `${basePath}${fallback}`;
}
export function websiteCards(values: WebsiteValues, key: string): { title: string; body: string }[] {
  try { const cards = JSON.parse(values[key] || "[]"); return Array.isArray(cards) ? cards : []; } catch { return []; }
}
export function websiteStyle(values: WebsiteValues): CSSProperties {
  const style: Record<string, string> = {};
  for (const color of ["navy", "midnight", "gold", "ivory"]) {
    const value = values[`design_color_${color}`];
    if (/^#[a-f0-9]{6}$/i.test(value || "")) style[`--${color}`] = value;
  }
  return style as CSSProperties;
}
