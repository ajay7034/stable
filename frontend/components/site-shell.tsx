"use client";
import { WebsiteCopy } from "@/components/website-copy";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { websiteImage, whatsappLink } from "@/lib/website";
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
  const whatsapp = whatsappLink(s);
  const logo = (
    <Link
      className="brand"
      href="/"
      aria-label="Stable Building Materials Trading LLC home"
    >
      <Image
        src={websiteImage(s.design_brand_logo)} unoptimized={!!s.design_brand_logo}
        alt="Stable company logo"
        width={56}
        height={52}
        priority
      />
      <span>
        {s.design_brand_name || "STABLE"}<small>{s.design_brand_subtitle}</small>
      </span>
    </Link>
  );
  return (
    <>
      <a className="skip" href="#main"><WebsiteCopy id="design_copy_de85e5114b75" fallback={"Skip to content"} /></a>
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
          {s.design_contact_secondary_phone && <a href={"tel:" + s.design_contact_secondary_phone.replace(/[^+\d]/g, "")}><Phone size={11} />{s.design_contact_secondary_phone}</a>}
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
          <Link className="button header-quote" href="/request-quote"><WebsiteCopy id="design_copy_871fce508f78" fallback={"Request a quote"} /><ArrowUpRight size={16} />
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
              <p className="eyebrow"><WebsiteCopy id="design_copy_12276e7976be" fallback={"THE MATERIALS COLLECTION"} /></p>
              <h2><WebsiteCopy id="design_copy_ae45ae2f7a6a" fallback={"Everything starts"} /><br /><WebsiteCopy id="design_copy_1b71815665f2" fallback={"with the right material."} /></h2>
              <Link
                prefetch={false}
                className="text-link"
                href="/products"
                onClick={() => setMega(false)}
              ><WebsiteCopy id="design_copy_d16585022d32" fallback={"Explore all materials"} /><ArrowRight size={16} />
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
            <Dialog.Title className="sr-only"><WebsiteCopy id="design_copy_3f644ca294f6" fallback={"Main menu"} /></Dialog.Title>
            <Dialog.Description className="sr-only"><WebsiteCopy id="design_copy_09f137095d53" fallback={"Navigate the Stable website."} /></Dialog.Description>
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
            ><WebsiteCopy id="design_copy_5c353f67b148" fallback={"Request a quotation"} /><ArrowUpRight size={18} />
            </Link>
            <div className="mobile-contact">
              <p>{s.address}</p>
              <a href={"tel:" + s.phone}>{s.phone}</a>
              {s.design_contact_secondary_phone && <a href={"tel:" + s.design_contact_secondary_phone.replace(/[^+\d]/g, "")}>{s.design_contact_secondary_phone}</a>}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={search} onOpenChange={setSearch}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-backdrop" />
          <Dialog.Content className="search-panel">
            <Dialog.Title><WebsiteCopy id="design_copy_a4287ff03073" fallback={"Find your starting point."} /></Dialog.Title>
            <Dialog.Description><WebsiteCopy id="design_copy_31d6f3c8f68a" fallback={"Search materials by name or keyword."} /></Dialog.Description>
            <Dialog.Close
              className="icon-button dialog-close"
              aria-label="Close search"
            >
              <X />
            </Dialog.Close>
            <form
              action={`${basePath}/products`}
              className="search-form"
              onSubmit={() => setSearch(false)}
            >
              <Search size={22} />
              <input
                name="q"
                aria-label="Search materials"
                placeholder={s.design_search_placeholder}
              />
              <button className="button"><WebsiteCopy id="design_copy_6b4aa23e0567" fallback={"Search"} /><ArrowRight size={18} />
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <p className="eyebrow">{s.design_footer_eyebrow}</p>
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
            <h3>{s.design_footer_explore_label}</h3>
            {(footer.length ? footer : nav).map((m) => (
              <Link key={m.id} href={m.href}>
                {m.label}
              </Link>
            ))}
          </div>
          <div>
            <h3>{s.design_footer_materials_label}</h3>
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
            <h3>{s.design_footer_contact_label}</h3>
            <p>{s.address}</p>
            <a href={"tel:" + s.phone}>{s.phone}</a>
              {s.design_contact_secondary_phone && <a href={"tel:" + s.design_contact_secondary_phone.replace(/[^+\d]/g, "")}>{s.design_contact_secondary_phone}</a>}
            <a href={"mailto:" + s.email}>{s.email}</a>
            <a className="footer-whatsapp" href={whatsapp}>
              {s.design_footer_whatsapp_label}
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
          <span>{s.design_footer_promise}</span>
        </div>
      </footer>
      {s.design_contact_whatsapp_enabled !== "0" && <a className="floating-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label={s.design_contact_whatsapp_label || "Chat with Stable on WhatsApp"}><svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5ZM12 22a10 10 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.3-.4A10 10 0 1 1 12 22Zm5.5-7.5c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.1-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4S5.7 7.6 5.7 9s1 2.8 1.2 3 2.1 3.2 5.1 4.5l1.7.6a4 4 0 0 0 1.9.1c.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4s-.2-.2-.5-.4Z" /></svg><span>{s.design_contact_whatsapp_label || "Chat on WhatsApp"}</span></a>}
      {count > 0 && path !== "/request-quote" && (
        <Link className="floating-quote" href="/request-quote">
          <ClipboardList size={20} />
          {s.design_floating_quote_label}<span>{count}</span>
          <ArrowRight size={16} />
        </Link>
      )}
    </>
  );
}
