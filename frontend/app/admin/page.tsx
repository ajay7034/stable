"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Files,
  Package,
  Layers,
  BookOpen,
  Briefcase,
  Mail,
  ClipboardList,
  ImageIcon,
  Users,
  Settings,
  Menu as MenuIcon,
  Shield,
  Activity,
  LogOut,
  ArrowUpRight,
  Plus,
  Search,
  ChevronRight,
  Download,
  Eye,
  History,
  Save,
  UserRound,
  Bell,
  Check,
  Clock,
  Trash2,
} from "lucide-react";
import { clientApi } from "@/lib/client-api";
import type { RecordData } from "@/lib/api";
import { MediaManager } from "@/components/media-manager";
import { StaffManager } from "@/components/staff-manager";
import { SectionEditor } from "@/components/section-editor";
import { RichText } from "@/components/rich-text";
import {
  NavigationEditor,
  ProductDetailsEditor,
  FAQEditor,
  PermissionsEditor,
  AccountPanel,
  SystemPanel,
} from "@/components/studio-panels";
const RichEditor = dynamic(
  () => import("@/components/rich-editor").then((m) => m.RichEditor),
  { ssr: false, loading: () => <p>Loading editor…</p> },
);
type Row = {
  id: number;
  title?: string;
  slug?: string;
  description?: string;
  body?: string;
  status?: string;
  [key: string]: unknown;
};
type User = { email: string; role: string };
const menu = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "pages", label: "Pages", icon: Files },
  { key: "categories", label: "Categories", icon: Layers },
  { key: "products", label: "Products", icon: Package },
  { key: "blogs", label: "Journal", icon: BookOpen },
  { key: "careers", label: "Careers", icon: Briefcase },
  { key: "media", label: "Media library", icon: ImageIcon },
  { key: "inquiries", label: "Enquiries", icon: Mail },
  { key: "quotes", label: "Quotations", icon: ClipboardList },
  { key: "applications", label: "Applications", icon: Users },
  { key: "navigation", label: "Navigation", icon: MenuIcon },
  { key: "settings", label: "Site settings", icon: Settings },
  { key: "users", label: "Staff accounts", icon: Users },
  { key: "permissions", label: "Permissions", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "audit_logs", label: "Activity log", icon: Activity },
  { key: "system", label: "System", icon: Settings },
  { key: "account", label: "My account", icon: UserRound },
];
const content = ["pages", "categories", "products", "blogs", "careers"];
const special = [
  "media",
  "users",
  "navigation",
  "permissions",
  "system",
  "account",
];
const fieldLabels: Record<string, string> = {
  title: "Title",
  slug: "URL slug",
  description: "Short description",
  body: "Main content",
  status: "Publication status",
  cover_id: "Cover image",
  category_id: "Category",
  parent_id: "Parent category",
  seo_title: "SEO title",
  seo_description: "SEO description",
  featured: "Feature this item",
  publish_at: "Scheduled publication (UTC)",
  tags: "Search keywords / tags",
  product_code: "Product reference",
  availability: "Availability",
  features: "Key features",
  applications: "Applications",
  author: "Author",
  blog_category: "Journal category",
  department: "Department",
  location: "Location",
  employment_type: "Employment type",
};
export default function Admin() {
  const [user, setUser] = useState<User | null>(null),
    [access, setAccess] = useState<Record<string, boolean>>({}),
    [ready, setReady] = useState(false),
    [csrf, setCsrf] = useState(""),
    [module, setModule] = useState("dashboard"),
    [rows, setRows] = useState<Row[]>([]),
    [edit, setEdit] = useState<Row | null>(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [selected, setSelected] = useState<number[]>([]),
    [bulk, setBulk] = useState("draft"),
    [media, setMedia] = useState<{ id: number; alt: string }[]>([]),
    [categories, setCategories] = useState<Row[]>([]),
    [versions, setVersions] = useState<
      { id: number; content: string; created_at: string }[]
    >([]),
    [preview, setPreview] = useState<RecordData | null>(null);
  const resource = module === "quotes" ? "inquiries" : module;
  const label = menu.find((m) => m.key === module)?.label || module;
  async function session() {
    const s = await clientApi<{
      user: User | null;
      csrf: string;
      access: Record<string, boolean>;
    }>("auth/session");
    setUser(s.user);
    setCsrf(s.csrf);
    setAccess(s.access);
  }
  useEffect(() => {
    session()
      .catch((e) => setNotice(e.message))
      .finally(() => setReady(true));
  }, []);
  async function load() {
    if (special.includes(module)) {
      setRows([]);
      return;
    }
    setBusy(true);
    try {
      setRows(await clientApi<Row[]>("admin/" + resource));
    } catch (e) {
      setRows([]);
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (user) load();
    setEdit(null);
    setVersions([]);
    setPreview(null);
    setQuery("");
    setFilter("");
    setSelected([]);
    setNotice("");
  }, [module, user]);
  useEffect(() => {
    if (user && content.includes(module)) {
      if (access.media)
        clientApi<{ id: number; alt: string }[]>("admin/media")
          .then(setMedia)
          .catch(() => setMedia([]));
      if (access.categories)
        clientApi<Row[]>("admin/categories")
          .then(setCategories)
          .catch(() => setCategories([]));
    }
  }, [module, user, access]);
  function can(key: string) {
    if (["dashboard", "account"].includes(key)) return true;
    return (
      access[
        key === "quotes"
          ? "inquiries"
          : key === "permissions"
            ? "users"
            : key === "notifications"
              ? "system"
              : key
      ] === true
    );
  }
  function draftSaved() {
    if (edit) setEdit({ ...edit, status: "draft" });
    load();
  }
  function newRecord() {
    setEdit({
      id: 0,
      title: "",
      slug: "",
      description: "",
      body: "",
      status: "draft",
      featured: 0,
      availability: "enquire",
      author: "Stable team",
      location: "Ajman, UAE",
    });
    setVersions([]);
    setPreview(null);
  }
  const filtered = rows.filter(
    (r) =>
      (module !== "quotes" || r.kind === "quotes") &&
      (module !== "inquiries" || r.kind === "contact") &&
      (!filter || r.status === filter) &&
      (!query ||
        [r.title, r.name, r.email, r.message, r.action, r.event]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!from || String(r.created_at || "").slice(0, 10) >= from) &&
      (!to || String(r.created_at || "").slice(0, 10) <= to),
  );
  if (!user)
    return (
      <div className="login-screen">
        <div className="login-visual">
          <Image
            src="/images/architecture.webp"
            alt="Architectural concept"
            fill
            sizes="50vw"
          />
          <div>
            <Image src="/logo-transparent.png" alt="Stable logo" width={80} height={74} />
            <p className="eyebrow">STABLE CONTENT STUDIO</p>
            <h1>
              Built on trust.
              <br />
              Managed with care.
            </h1>
          </div>
        </div>
        <div className="login-form">
          <Link href="/" className="text-link">
            Back to the website
            <ArrowUpRight size={16} />
          </Link>
          <p className="eyebrow">YOUR PRIVATE WORKSPACE</p>
          <h1>Welcome back.</h1>
          <p>Sign in to manage your website and customer enquiries.</p>
          <form
            className="inquiry"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setNotice("");
              try {
                await clientApi(
                  "auth/login",
                  csrf,
                  "POST",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                await session();
              } catch (e) {
                setNotice((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button disabled={!ready || busy}>
              {busy ? "Signing in…" : "Sign in"}
              <ArrowUpRight size={17} />
            </button>
            <p role="alert">{notice}</p>
          </form>
          <small>
            Authorized staff only. Accounts are created by your administrator.
          </small>
        </div>
      </div>
    );
  return (
    <div className="studio">
      <aside className="studio-sidebar">
        <Link className="brand" href="/">
          <Image src="/logo-transparent.png" alt="Stable logo" width={42} height={40} />
          <span>
            STABLE<small>CONTENT STUDIO</small>
          </span>
        </Link>
        <p className="sidebar-label">WORKSPACE</p>
        <nav aria-label="Content studio">
          {menu
            .filter((m) => can(m.key))
            .map((m) => (
              <button
                key={m.key}
                className={module === m.key ? "selected" : ""}
                onClick={() => setModule(m.key)}
              >
                <m.icon size={17} />
                {m.label}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <span>{user.email}</span>
          <small>{user.role.replaceAll("_", " ")}</small>
          <button
            onClick={async () => {
              try {
                await clientApi("auth/logout", csrf, "POST", {});
                await session();
              } catch (e) {
                setNotice((e as Error).message);
              }
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="studio-main" role="main">
        <div className="studio-topbar">
          <div>
            Workspace
            <ChevronRight size={13} />
            <strong>{label}</strong>
          </div>
          <Link href="/" target="_blank" className="text-link">
            View website
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="studio-content">
          <div className="studio-heading">
            <div>
              <p className="eyebrow">STABLE / CONTENT STUDIO</p>
              <h1>{module === "dashboard" ? "Your workspace." : label}</h1>
              <p>
                {module === "dashboard"
                  ? "A clear view of your website, materials and conversations."
                  : content.includes(module)
                    ? "Create, refine and publish content with confidence. Draft changes keep the current live version online."
                    : "Manage your website with care."}
              </p>
            </div>
            {content.includes(module) && (
              <button onClick={newRecord}>
                <Plus size={16} />
                Add record
              </button>
            )}
          </div>
          {notice && (
            <p className="studio-notice" role="status">
              {notice}
            </p>
          )}
          {module === "dashboard" ? (
            <>
              <div className="dashboard-grid">
                {rows.map((r, i) => {
                  const Icon = [Package, Layers, BookOpen, Mail, Users][i % 5];
                  return (
                    <div className="metric-card" key={String(r.title)}>
                      <span>
                        <Icon size={19} />
                        {String(r.title)}
                      </span>
                      <strong>{String(r.count)}</strong>
                      <small>Current database records</small>
                    </div>
                  );
                })}
              </div>
              <div className="dashboard-welcome">
                <div>
                  <p className="eyebrow">ALWAYS TRUSTED</p>
                  <h2>
                    Good content.
                    <br />
                    Stronger conversations.
                  </h2>
                  <p>
                    Keep your materials current, respond to enquiries and share
                    helpful ideas. Every detail adds to the Stable experience.
                  </p>
                  <div className="actions">
                    {can("products") && (
                      <button onClick={() => setModule("products")}>
                        Manage products
                        <ArrowUpRight size={16} />
                      </button>
                    )}
                    {can("inquiries") && (
                      <button onClick={() => setModule("inquiries")}>
                        Review enquiries
                        <ArrowUpRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <Image
                  src="/images/architecture.webp"
                  alt="Architectural concept"
                  width={480}
                  height={380}
                />
              </div>
            </>
          ) : null}
          {module === "media" && <MediaManager csrf={csrf} />}{" "}
          {module === "users" && <StaffManager csrf={csrf} />}{" "}
          {module === "navigation" && <NavigationEditor csrf={csrf} />}{" "}
          {module === "permissions" && <PermissionsEditor csrf={csrf} />}{" "}
          {module === "system" && <SystemPanel csrf={csrf} />}{" "}
          {module === "account" && <AccountPanel csrf={csrf} />}
          {module === "notifications" && (
            <p>
              Messages remain stored independently of email. Delivery needs
              configured SMTP and the scheduled worker. Pending, sent and failed
              statuses are shown below.
            </p>
          )}
          {!special.includes(module) &&
            !["dashboard", "settings"].includes(module) && (
              <>
                <div className="studio-filter">
                  <label className="studio-search">
                    <Search size={17} />
                    <input
                      aria-label={"Search " + label}
                      placeholder={"Search " + label.toLowerCase() + "…"}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  {!["audit_logs"].includes(module) && (
                    <select
                      aria-label="Filter status"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {[
                        ...new Set(rows.map((r) => r.status).filter(Boolean)),
                      ].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  )}
                  {["inquiries", "quotes", "applications"].includes(module) && (
                    <>
                      <label>
                        From
                        <input
                          type="date"
                          value={from}
                          onChange={(e) => setFrom(e.target.value)}
                        />
                      </label>
                      <label>
                        To
                        <input
                          type="date"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                        />
                      </label>
                      <a
                        className="button"
                        href={"/api/v1/admin/export/" + resource}
                      >
                        <Download size={15} />
                        Export CSV
                      </a>
                    </>
                  )}
                </div>
              </>
            )}
          {module === "products" && (
            <details className="import-panel">
              <summary>Import, export & bulk actions</summary>
              <div className="actions">
                <a className="button" href="/api/v1/admin/export/products">
                  <Download size={15} />
                  Export CSV template
                </a>
                <select
                  aria-label="Bulk product status"
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                >
                  <option value="draft">Save as draft</option>
                  <option value="published">Publish selected</option>
                  <option value="archived">Archive selected</option>
                </select>
                <button
                  disabled={!selected.length}
                  onClick={async () => {
                    try {
                      await clientApi("admin/bulk/products", csrf, "POST", {
                        ids: selected,
                        status: bulk,
                      });
                      setSelected([]);
                      await load();
                      setNotice("Bulk action completed.");
                    } catch (e) {
                      setNotice((e as Error).message);
                    }
                  }}
                >
                  Apply to {selected.length} selected
                </button>
              </div>
              <form
                className="inquiry"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const r = await clientApi<{ imported: number }>(
                      "admin/import/products",
                      csrf,
                      "POST",
                      new FormData(e.currentTarget),
                    );
                    await load();
                    setNotice(`Imported ${r.imported} draft products.`);
                  } catch (e) {
                    setNotice((e as Error).message);
                  }
                }}
              >
                <label>
                  CSV file (maximum 1000 rows)
                  <input type="file" name="file" accept=".csv" required />
                </label>
                <button>Validate and import</button>
              </form>
            </details>
          )}
          {edit && (
            <div className="record-editor">
              <div className="editor-heading">
                <div>
                  <p className="eyebrow">
                    {edit.id ? "EDIT RECORD" : "NEW RECORD"}
                  </p>
                  <h2>{edit.title || "Start with a title."}</h2>
                </div>
                <button
                  onClick={() => {
                    setEdit(null);
                    setPreview(null);
                  }}
                >
                  Close editor
                </button>
              </div>
              <form
                className="admin-editor"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  try {
                    const result = await clientApi<{ id: number }>(
                      "admin/" + resource + (edit.id ? "/" + edit.id : ""),
                      csrf,
                      edit.id ? "PUT" : "POST",
                      edit,
                    );
                    setEdit({ ...edit, id: result.id || edit.id });
                    await load();
                    setNotice(
                      edit.status === "published"
                        ? "Published successfully."
                        : edit.status === "archived"
                          ? "Archived and removed from the public site."
                          : "Draft saved. Existing live content remains unchanged.",
                    );
                  } catch (e) {
                    setNotice((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {(content.includes(module)
                  ? [
                      "title",
                      "slug",
                      "description",
                      "body",
                      "status",
                      "publish_at",
                      "cover_id",
                      ...(module === "products"
                        ? [
                            "category_id",
                            "product_code",
                            "availability",
                            "features",
                            "applications",
                          ]
                        : []),
                      ...(module === "categories" ? ["parent_id"] : []),
                      ...(module === "blogs"
                        ? ["author", "blog_category"]
                        : []),
                      ...(module === "careers"
                        ? ["department", "location", "employment_type"]
                        : []),
                      "featured",
                      "tags",
                      "seo_title",
                      "seo_description",
                    ]
                  : ["status", "notes"]
                ).map((k) => (
                  <div key={k} className={k === "body" ? "rich-field" : ""}>
                    <label htmlFor={"edit-" + k}>{fieldLabels[k] || k}</label>
                    {k === "body" ? (
                      <RichEditor
                        key={module + edit.id}
                        value={String(edit.body || "")}
                        onChange={(body) => setEdit({ ...edit, body })}
                      />
                    ) : k === "status" ? (
                      <select
                        id={"edit-" + k}
                        value={edit.status || "draft"}
                        onChange={(e) =>
                          setEdit({ ...edit, status: e.target.value })
                        }
                      >
                        {(content.includes(module)
                          ? ["draft", "published", "scheduled", "archived"]
                          : ["new", "in_progress", "replied", "closed"]
                        ).map((st) => (
                          <option key={st}>{st}</option>
                        ))}
                      </select>
                    ) : k === "featured" ? (
                      <select
                        id={"edit-" + k}
                        value={Number(edit[k] || 0)}
                        onChange={(e) =>
                          setEdit({ ...edit, [k]: Number(e.target.value) })
                        }
                      >
                        <option value={0}>No</option>
                        <option value={1}>Yes</option>
                      </select>
                    ) : k === "cover_id" ? (
                      <select
                        id={"edit-" + k}
                        value={String(edit[k] || "")}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            [k]: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      >
                        <option value="">No cover image</option>
                        {media.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.alt}
                          </option>
                        ))}
                      </select>
                    ) : ["category_id", "parent_id"].includes(k) ? (
                      <select
                        id={"edit-" + k}
                        value={String(edit[k] || "")}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            [k]: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      >
                        <option value="">None</option>
                        {categories
                          .filter(
                            (c) => module !== "categories" || c.id !== edit.id,
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                      </select>
                    ) : k === "availability" ? (
                      <select
                        id={"edit-" + k}
                        value={String(edit[k] || "enquire")}
                        onChange={(e) =>
                          setEdit({ ...edit, [k]: e.target.value })
                        }
                      >
                        <option value="enquire">Confirm on enquiry</option>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    ) : k === "publish_at" ? (
                      <input
                        id={"edit-" + k}
                        type="datetime-local"
                        value={String(edit[k] || "")
                          .replace(" ", "T")
                          .slice(0, 16)}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            [k]: e.target.value
                              ? e.target.value.replace("T", " ") + ":00"
                              : null,
                          })
                        }
                      />
                    ) : [
                        "description",
                        "notes",
                        "features",
                        "applications",
                        "seo_description",
                      ].includes(k) ? (
                      <textarea
                        id={"edit-" + k}
                        rows={3}
                        value={String(edit[k] || "")}
                        onChange={(e) =>
                          setEdit({ ...edit, [k]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        id={"edit-" + k}
                        value={String(edit[k] || "")}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (k === "slug")
                            value = value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-")
                              .replace(/-+/g, "-");
                          setEdit({ ...edit, [k]: value });
                        }}
                      />
                    )}
                  </div>
                ))}
                <div className="actions">
                  <button disabled={busy}>
                    <Save size={15} />
                    {busy ? "Saving…" : "Save"}
                  </button>
                  {edit.id > 0 && content.includes(module) && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setPreview(
                              await clientApi<RecordData>(
                                "admin/preview/" + module + "/" + edit.id,
                              ),
                            );
                          } catch (e) {
                            setNotice((e as Error).message);
                          }
                        }}
                      >
                        <Eye size={15} />
                        Preview saved draft
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setVersions(
                              await clientApi(
                                "admin/versions/" + module + "/" + edit.id,
                              ),
                            );
                          } catch (e) {
                            setNotice((e as Error).message);
                          }
                        }}
                      >
                        <History size={15} />
                        Version history
                      </button>
                    </>
                  )}
                </div>
              </form>
              {preview && (
                <article className="draft-preview">
                  <p className="eyebrow">PRIVATE DRAFT PREVIEW</p>
                  <h1>{preview.title}</h1>
                  <p>{preview.description}</p>
                  {preview.cover_id && (
                    <img
                      className="content-cover"
                      src={"/api/v1/media/" + preview.cover_id}
                      alt={preview.title}
                    />
                  )}
                  <RichText value={preview.body || ""} />
                  {preview.sections?.map((section) => (
                    <section key={section.id}>
                      <p className="eyebrow">{section.eyebrow}</p>
                      <h2>{section.heading}</h2>
                      <p>{section.body}</p>
                    </section>
                  ))}
                  <button onClick={() => setPreview(null)}>
                    Close preview
                  </button>
                </article>
              )}
              {versions.length > 0 && (
                <section className="version-list">
                  <h3>Previous revisions</h3>
                  {versions.map((v) => (
                    <div key={v.id} className="admin-row">
                      <span>{v.created_at} UTC</span>
                      <button
                        onClick={async () => {
                          try {
                            const restored = await clientApi<Row>(
                              "admin/restore/" + v.id,
                              csrf,
                              "POST",
                              {},
                            );
                            setEdit(restored);
                            setNotice(
                              "Revision restored as a draft. Publish when ready.",
                            );
                            await load();
                          } catch (e) {
                            setNotice((e as Error).message);
                          }
                        }}
                      >
                        Restore revision as draft
                      </button>
                    </div>
                  ))}
                </section>
              )}
              {edit.id > 0 && module === "pages" && (
                <SectionEditor
                  page={edit.id}
                  csrf={csrf}
                  onSaved={draftSaved}
                />
              )}{" "}
              {edit.id > 0 && module === "products" && (
                <ProductDetailsEditor
                  id={edit.id}
                  csrf={csrf}
                  onSaved={draftSaved}
                />
              )}{" "}
              {edit.id > 0 && content.includes(module) && (
                <FAQEditor
                  module={module}
                  id={edit.id}
                  csrf={csrf}
                  onSaved={draftSaved}
                />
              )}
            </div>
          )}
          {module === "settings" && (
            <form
              className="admin-editor"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await clientApi(
                    "admin/settings",
                    csrf,
                    "PUT",
                    Object.fromEntries(new FormData(e.currentTarget)),
                  );
                  setNotice("Site settings updated.");
                } catch (e) {
                  setNotice((e as Error).message);
                }
              }}
            >
              <p>
                Public company details and website labels. Leave unverified
                details blank. Never enter passwords or SMTP credentials here.
              </p>
              {rows
                .filter(
                  (r) =>
                    !["design_seeded", "taxonomy_seeded"].includes(
                      String(r.key),
                    ),
                )
                .map((r) => (
                  <label key={String(r.key)}>
                    {String(r.key).replaceAll("_", " ")}
                    {String(r.key) === "display_director" ? (
                      <select
                        name={String(r.key)}
                        defaultValue={String(r.value)}
                      >
                        <option value="0">Hide director details</option>
                        <option value="1">Show director details</option>
                      </select>
                    ) : (
                      <textarea
                        rows={String(r.value).length > 130 ? 3 : 2}
                        name={String(r.key)}
                        defaultValue={String(r.value)}
                      />
                    )}
                  </label>
                ))}
              <button>
                <Save size={16} />
                Save settings
              </button>
            </form>
          )}
          {!special.includes(module) &&
            !["dashboard", "settings"].includes(module) && (
              <div className="record-list">
                {busy && !rows.length ? (
                  <p>Loading records…</p>
                ) : filtered.length === 0 ? (
                  <div className="empty">
                    <h3>No records to show.</h3>
                    <p>
                      {content.includes(module)
                        ? "Add your first record, or change the filters."
                        : "New records will appear here when they are received."}
                    </p>
                  </div>
                ) : (
                  filtered.map((r) => (
                    <article className="admin-row" key={r.id}>
                      <div className="record-summary">
                        {module === "products" && (
                          <input
                            aria-label={"Select " + r.title}
                            type="checkbox"
                            checked={selected.includes(r.id)}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? [...selected, r.id]
                                  : selected.filter((id) => id !== r.id),
                              )
                            }
                          />
                        )}
                        <div>
                          <strong>
                            {r.title ||
                              String(r.name || r.action || r.event || "Record")}
                          </strong>
                          {r.status && (
                            <p>
                              <span className="status-pill">{r.status}</span>
                            </p>
                          )}
                          {["inquiries", "quotes", "applications"].includes(
                            module,
                          ) && (
                            <>
                              <p>
                                {String(r.email)} · {String(r.phone)}
                              </p>
                              <p style={{ whiteSpace: "pre-line" }}>
                                {String(r.message)}
                                {[
                                  "subject",
                                  "project_location",
                                  "required_date",
                                  "category",
                                ].map((k) =>
                                  r[k] ? (
                                    <span key={k} style={{ display: "block" }}>
                                      {k.replaceAll("_", " ")}: {String(r[k])}
                                    </span>
                                  ) : null,
                                )}
                              </p>
                              <small>{String(r.created_at)} UTC</small>
                              {module === "quotes" && !!r.attachment && (
                                <p>
                                  <a
                                    className="text-link"
                                    href={"/api/v1/admin/boq/" + r.id}
                                  >
                                    Download private BOQ
                                    <Download size={13} />
                                  </a>
                                </p>
                              )}
                              {module === "applications" && (
                                <p>
                                  <a
                                    className="text-link"
                                    href={"/api/v1/admin/resume/" + r.id}
                                  >
                                    Resume, if provided
                                    <Download size={13} />
                                  </a>
                                </p>
                              )}
                            </>
                          )}
                          {module === "audit_logs" && (
                            <p>
                              {String(r.created_at)} UTC · Staff #
                              {String(r.user_id)}
                            </p>
                          )}
                          {module === "notifications" && (
                            <p>
                              Reference #{String(r.record_id)} ·{" "}
                              {String(r.attempts)} attempts ·{" "}
                              {String(r.created_at)} UTC
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="row-actions">
                        {!["audit_logs", "notifications"].includes(module) && (
                          <button
                            onClick={() => {
                              setEdit(r);
                              setVersions([]);
                              setPreview(null);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {["inquiries", "quotes", "applications"].includes(
                          module,
                        ) && (
                          <button
                            aria-label="Delete personal data"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Permanently delete this record and its private attachment?",
                                )
                              )
                                return;
                              try {
                                await clientApi(
                                  "admin/purge/" + resource + "/" + r.id,
                                  csrf,
                                  "DELETE",
                                );
                                await load();
                                setNotice(
                                  "Personal data and attachments deleted.",
                                );
                              } catch (e) {
                                setNotice((e as Error).message);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
