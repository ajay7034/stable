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

export type WebsiteLogo = { name: string; image: string; visible: boolean };
export function websiteLogos(value?: string): WebsiteLogo[] {
  try {
    const items = JSON.parse(value || "[]");
    return Array.isArray(items) ? items.filter((item) => typeof item.name === "string" && /^\d+$/.test(item.image) && typeof item.visible === "boolean") : [];
  } catch { return []; }
}
export function whatsappLink(values: WebsiteValues) {
  return "https://wa.me/" + (values.design_contact_whatsapp || values.whatsapp || "971505698227").replace(/\D/g, "");
}
