"use client";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Search,
  Phone,
  MapPin,
  Mail,
  ClipboardList,
  Instagram,
  Linkedin,
} from "lucide-react";
import type { RecordData } from "@/lib/api";
type MenuItem = { id: number; label: string; href: string; group_name: string };
export function SiteShell({
  settings: s,
  categories,
  menu,
  legal,
  children,
}: {
  settings: Record<string, string>;
  categories: RecordData[];
  menu: MenuItem[];
  legal: RecordData[];
  children: React.ReactNode;
}) {
  const path = usePathname(),
    [mega, setMega] = useState(false),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [count, setCount] = useState(0);
  useEffect(() => {
    setMega(false);
    setMobile(false);
    setSearch(false);
  }, [path]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMega(false);
    };
    const load = () => {
      try {
        const list = JSON.parse(localStorage.getItem("stable-quote") || "[]");
        setCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setCount(0);
      }
    };
    load();
    document.addEventListener("keydown", close);
    window.addEventListener("stable-quote-updated", load);
    window.addEventListener("storage", load);
    return () => {
      document.removeEventListener("keydown", close);
      window.removeEventListener("stable-quote-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  if (path.startsWith("/admin")) return <>{children}</>;
  const nav = menu.filter((m) => m.group_name === "header"),
    footer = menu.filter((m) => m.group_name === "footer");
  const whatsapp =
    "https://wa.me/" + (s.whatsapp || "971525463574").replace(/\D/g, "");
  const logo = (
    <Link
      className="brand"
      href="/"
      aria-label="Stable Building Materials Trading LLC home"
    >
      <Image
        src={`${basePath}/logo-transparent.png`}
        alt="Stable company logo"
        width={56}
        height={52}
        priority
      />
      <span>
        STABLE<small>BUILDING MATERIALS TRADING LLC</small>
      </span>
    </Link>
  );
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="utility">
        <span>
          <MapPin size={11} />
          {s.utility_label}
        </span>
        <div>
          <a href={"mailto:" + s.email}>{s.email}</a>
          <span className="utility-line" />
          <a href={"tel:" + s.phone}>
            <Phone size={11} />
            {s.phone}
          </a>
        </div>
      </div>
      <header className="site-header">
        {logo}
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map((m) =>
            m.href === "/products" ? (
              <button
                key={m.id}
                className={"nav-link " + (mega ? "active" : "")}
                aria-expanded={mega}
                aria-controls="material-menu"
                onClick={() => setMega(!mega)}
              >
                {m.label}
                <ChevronDown size={13} />
              </button>
            ) : (
              <Link
                prefetch={false}
                className={"nav-link " + (path === m.href ? "active" : "")}
                key={m.id}
                href={m.href}
              >
                {m.label}
              </Link>
            ),
          )}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button search-trigger"
            aria-label="Search materials"
            onClick={() => setSearch(true)}
          >
            <Search size={19} />
          </button>
          <Link className="button header-quote" href="/request-quote">
            Request a quote
            <ArrowUpRight size={16} />
            {count > 0 && <span className="quote-badge">{count}</span>}
          </Link>
          <button
            className="icon-button mobile-trigger"
            aria-label="Open menu"
            onClick={() => setMobile(true)}
          >
            <Menu size={23} />
          </button>
        </div>
        {mega && (
          <div className="mega-menu" id="material-menu">
            <div className="mega-intro">
              <p className="eyebrow">THE MATERIALS COLLECTION</p>
              <h2>
                Everything starts
                <br />
                with the right material.
              </h2>
              <Link
                prefetch={false}
                className="text-link"
                href="/products"
                onClick={() => setMega(false)}
              >
                Explore all materials
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mega-categories">
              {categories
                .filter((c) => !c.parent_id)
                .map((c, i) => (
                  <Link
                    prefetch={false}
                    href={"/products/category/" + c.slug}
                    key={c.id}
                    onClick={() => setMega(false)}
                  >
                    <span>0{i + 1}</span>
                    {c.title}
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
            </div>
          </div>
        )}
      </header>
      {mega && (
        <button
          className="menu-dismiss"
          aria-label="Close materials menu"
          onClick={() => setMega(false)}
        />
      )}
      <Dialog.Root open={mobile} onOpenChange={setMobile}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-backdrop" />
          <Dialog.Content className="mobile-panel">
            <Dialog.Title className="sr-only">Main menu</Dialog.Title>
            <Dialog.Description className="sr-only">
              Navigate the Stable website.
            </Dialog.Description>
            <div className="mobile-panel-top">
              {logo}
              <Dialog.Close className="icon-button" aria-label="Close menu">
                <X />
              </Dialog.Close>
            </div>
            <nav aria-label="Mobile navigation">
              {nav.map((m, i) => (
                <Link href={m.href} key={m.id} onClick={() => setMobile(false)}>
                  <span>0{i + 1}</span>
                  {m.label}
                  <ArrowUpRight size={22} />
                </Link>
              ))}
            </nav>
            <Link
              prefetch={false}
              className="button"
              href="/request-quote"
              onClick={() => setMobile(false)}
            >
              Request a quotation
              <ArrowUpRight size={18} />
            </Link>
            <div className="mobile-contact">
              <p>{s.address}</p>
              <a href={"tel:" + s.phone}>{s.phone}</a>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={search} onOpenChange={setSearch}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-backdrop" />
          <Dialog.Content className="search-panel">
            <Dialog.Title>Find your starting point.</Dialog.Title>
            <Dialog.Description>
              Search materials by name or keyword.
            </Dialog.Description>
            <Dialog.Close
              className="icon-button dialog-close"
              aria-label="Close search"
            >
              <X />
            </Dialog.Close>
            <form
              action="/products"
              className="search-form"
              onSubmit={() => setSearch(false)}
            >
              <Search size={22} />
              <input
                name="q"
                aria-label="Search materials"
                placeholder="What are you looking for?"
              />
              <button className="button">
                Search
                <ArrowRight size={18} />
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <p className="eyebrow">LET’S BUILD SOMETHING THAT LASTS</p>
            <h2>{s.footer_heading}</h2>
            <p>{s.footer_description}</p>
          </div>
          <Link
            prefetch={false}
            href={s.footer_cta_href || "/contact"}
            className="circle-cta"
            aria-label={s.footer_cta_label || "Contact the team"}
          >
            <ArrowUpRight size={38} />
          </Link>
        </div>
        <div className="footer-columns">
          <div className="footer-brand">
            {logo}
            <p>{s.footer_summary}</p>
            <span className="brand-promise">{s.brand_theme}</span>
          </div>
          <div>
            <h3>Explore</h3>
            {(footer.length ? footer : nav).map((m) => (
              <Link key={m.id} href={m.href}>
                {m.label}
              </Link>
            ))}
          </div>
          <div>
            <h3>Our materials</h3>
            {categories
              .filter((c) => !c.parent_id)
              .slice(0, 8)
              .map((c) => (
                <Link key={c.id} href={"/products/category/" + c.slug}>
                  {c.title}
                </Link>
              ))}
          </div>
          <div className="footer-contact">
            <h3>Find us in Ajman</h3>
            <p>{s.address}</p>
            <a href={"tel:" + s.phone}>{s.phone}</a>
            <a href={"mailto:" + s.email}>{s.email}</a>
            <a className="footer-whatsapp" href={whatsapp}>
              Let’s talk on WhatsApp
              <ArrowUpRight size={15} />
            </a>
            {s.business_hours && <p>{s.business_hours}</p>}
            <div className="social-links">
              {s.instagram_url && (
                <a href={s.instagram_url} aria-label="Instagram">
                  <Instagram size={19} />
                </a>
              )}
              {s.linkedin_url && (
                <a href={s.linkedin_url} aria-label="LinkedIn">
                  <Linkedin size={19} />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {s.copyright_name || s.company_name}
          </span>
          <div>
            {legal.map((p) => (
              <Link href={"/" + p.slug} key={p.id}>
                {p.title}
              </Link>
            ))}
          </div>
          <span>Always Trusted. Always Stable.</span>
        </div>
      </footer>
      {count > 0 && path !== "/request-quote" && (
        <Link className="floating-quote" href="/request-quote">
          <ClipboardList size={20} />
          Your quote list<span>{count}</span>
          <ArrowRight size={16} />
        </Link>
      )}
    </>
  );
}
