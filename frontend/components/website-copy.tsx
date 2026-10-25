"use client";
import { useWebsite } from "@/components/website-provider";
/** Plain text only: preserves the enclosing link, label or heading semantics. */
export function WebsiteCopy({ id, fallback }: { id: string; fallback: string }) {
  const settings = useWebsite();
  return settings[id] ?? fallback;
}
