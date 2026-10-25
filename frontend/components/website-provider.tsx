"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { WebsiteValues } from "@/lib/website";
const WebsiteContext = createContext<WebsiteValues>({});
export function WebsiteProvider({ settings, children }: { settings: WebsiteValues; children: ReactNode }) {
  return <WebsiteContext.Provider value={settings}>{children}</WebsiteContext.Provider>;
}
export function useWebsite() { return useContext(WebsiteContext); }
