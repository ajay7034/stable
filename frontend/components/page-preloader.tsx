"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function BrandLoader({ leaving = false }: { leaving?: boolean }) {
  return (
    <div className={`page-preloader${leaving ? " is-leaving" : ""}`} role="status" aria-label="Loading page" data-testid="page-preloader">
      <div className="preloader-brand" aria-hidden="true">
        <div className="preloader-mark">
          <img className="preloader-mark-outline" src={`${basePath}/logo-transparent.png`} alt="" width={112} height={104} />
          <img className="preloader-mark-reveal" src={`${basePath}/logo-transparent.png`} alt="" width={112} height={104} />
        </div>
        <span className="preloader-wordmark">STABLE</span>
        <span className="preloader-caption">ALWAYS TRUSTED.</span>
        <span className="preloader-line"><span /></span>
      </div>
    </div>
  );
}

function NavigationPreloader() {
  const pathname = usePathname();
  const search = useSearchParams();
  const routeKey = `${pathname}?${search.toString()}`;
  const [phase, setPhase] = useState<"visible" | "leaving" | "hidden">("visible");
  const startedAt = useRef(0);
  const minimum = useRef(1250);
  const expected = useRef<string | null>(null);
  const currentRoute = useRef(routeKey);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const watchdog = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimers = useCallback(() => {
    clearTimeout(finishTimer.current);
    clearTimeout(removeTimer.current);
    clearTimeout(watchdog.current);
  }, []);

  const finish = useCallback(() => {
    clearTimeout(finishTimer.current);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const remaining = reduced ? 0 : Math.max(0, minimum.current - (performance.now() - startedAt.current));
    finishTimer.current = setTimeout(() => {
      clearTimeout(watchdog.current);
      setPhase("leaving");
      removeTimer.current = setTimeout(() => setPhase("hidden"), reduced ? 0 : 420);
    }, remaining);
  }, []);

  const begin = useCallback((destination: string) => {
    clearTimers();
    expected.current = destination;
    startedAt.current = performance.now();
    minimum.current = 1100;
    setPhase("visible");
    // Cancelled navigations and network failures must never trap the visitor.
    watchdog.current = setTimeout(() => { expected.current = null; finish(); }, 9000);
  }, [clearTimers, finish]);

  useEffect(() => {
    startedAt.current = performance.now();
    finish();
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("data-no-preloader")) return;
      const destination = new URL(anchor.href, location.href);
      if (destination.origin !== location.origin || !["http:", "https:"].includes(destination.protocol)) return;
      if (basePath && destination.pathname !== basePath && !destination.pathname.startsWith(`${basePath}/`)) return;
      const path = destination.pathname.slice(basePath.length);
      if (/^\/api(?:\/|$)/.test(path) || /\.[a-z0-9]{2,8}$/i.test(path)) return;
      if (destination.pathname === location.pathname && destination.search === location.search) return;
      begin(`${destination.pathname.slice(basePath.length) || "/"}?${destination.searchParams.toString()}`);
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (event.defaultPrevented || !(form instanceof HTMLFormElement) || form.method.toLowerCase() !== "get" || (form.target && form.target !== "_self")) return;
      const destination = new URL(form.action || location.href, location.href);
      if (destination.origin !== location.origin) return;
      if (basePath && destination.pathname !== basePath && !destination.pathname.startsWith(`${basePath}/`)) return;
      destination.search = new URLSearchParams(Array.from(new FormData(form)).filter((entry): entry is [string, string] => typeof entry[1] === "string")).toString();
      if (destination.pathname === location.pathname && destination.search === location.search) return;
      begin(`${destination.pathname.slice(basePath.length) || "/"}?${destination.searchParams.toString()}`);
    };
    const onPopState = () => {
      const next = `${location.pathname.slice(basePath.length) || "/"}?${new URLSearchParams(location.search).toString()}`;
      if (next !== currentRoute.current) begin(next);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      clearTimers();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [begin, clearTimers, finish]);

  useEffect(() => {
    currentRoute.current = routeKey;
    if (expected.current === null || expected.current === routeKey) {
      expected.current = null;
      finish();
    }
  }, [routeKey, finish]);

  useEffect(() => {
    const content = document.getElementById("site-content");
    if (phase === "visible") content?.setAttribute("inert", "");
    else content?.removeAttribute("inert");
    return () => content?.removeAttribute("inert");
  }, [phase]);

  if (phase === "hidden") return null;
  return <BrandLoader leaving={phase === "leaving"} />;
}

export function PagePreloader() {
  return <Suspense fallback={<BrandLoader />}><NavigationPreloader /></Suspense>;
}
