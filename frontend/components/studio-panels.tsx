"use client";
import { useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import type { RecordData, FAQ } from "@/lib/api";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Download,
  Check,
} from "lucide-react";
type MenuItem = {
  label: string;
  href: string;
  group_name: string;
  visible: number;
};
export function NavigationEditor({ csrf }: { csrf: string }) {
  const [items, setItems] = useState<MenuItem[]>([]),
    [notice, setNotice] = useState("");
  useEffect(() => {
    clientApi<MenuItem[]>("admin/navigation")
      .then(setItems)
      .catch((e) => setNotice(e.message));
  }, []);
  function change(i: number, k: keyof MenuItem, v: string | number) {
    setItems(items.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  }
  function move(i: number, to: number) {
    const a = [...items];
    [a[i], a[to]] = [a[to], a[i]];
    setItems(a);
  }
  return (
    <div>
      <p>
        Choose the links shown in the header and footer. Use an internal website
        path, such as /about or /products.
      </p>
      {items.map((r, i) => (
        <div className="admin-editor" key={i}>
          <div className="editor-columns">
            <label>
              Link label
              <input
                value={r.label}
                onChange={(e) => change(i, "label", e.target.value)}
              />
            </label>
            <label>
              Destination
              <input
                value={r.href}
                onChange={(e) => change(i, "href", e.target.value)}
              />
            </label>
            <label>
              Location
              <select
                value={r.group_name}
                onChange={(e) => change(i, "group_name", e.target.value)}
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <label className="check">
              <input
                type="checkbox"
                checked={!!r.visible}
                onChange={(e) => change(i, "visible", e.target.checked ? 1 : 0)}
              />
              Visible
            </label>
            <button
              type="button"
              disabled={!i}
              onClick={() => move(i, i - 1)}
              aria-label="Move link up"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              disabled={i === items.length - 1}
              onClick={() => move(i, i + 1)}
              aria-label="Move link down"
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="actions">
        <button
          onClick={() =>
            setItems([
              ...items,
              {
                label: "New link",
                href: "/",
                group_name: "header",
                visible: 0,
              },
            ])
          }
        >
          <Plus size={15} />
          Add link
        </button>
        <button
          onClick={async () => {
            try {
              await clientApi("admin/navigation", csrf, "PUT", items);
              setNotice("Navigation saved.");
            } catch (e) {
              setNotice((e as Error).message);
            }
          }}
        >
          Save navigation
        </button>
      </div>
      <p role="status">{notice}</p>
    </div>
  );
}
type Pair = { label: string; value: string };
type Media = { id: number; alt: string };
export function ProductDetailsEditor({
  id,
  csrf,
  onSaved,
}: {
  id: number;
  csrf: string;
  onSaved: () => void;
}) {
  const [spec, setSpec] = useState<Pair[]>([]),
    [variants, setVariants] = useState<Pair[]>([]),
    [gallery, setGallery] = useState<number[]>([]),
    [media, setMedia] = useState<Media[]>([]),
    [notice, setNotice] = useState("");
  useEffect(() => {
    Promise.all([
      clientApi<RecordData>("admin/details/" + id),
      clientApi<Media[]>("admin/media"),
    ])
      .then(([p, m]) => {
        setSpec(p.specifications_list || []);
        setVariants(p.variants_list || []);
        setGallery((p.gallery || []).map((i) => i.media_id));
        setMedia(m);
      })
      .catch((e) => setNotice(e.message));
  }, [id]);
  function rows(list: Pair[], set: (rows: Pair[]) => void, label: string) {
    return (
      <div>
        <h3>{label}</h3>
        {list.map((r, i) => (
          <div className="editor-columns" key={i}>
            <label>
              Label
              <input
                value={r.label}
                onChange={(e) =>
                  set(
                    list.map((x, j) =>
                      j === i ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Value
              <input
                value={r.value}
                onChange={(e) =>
                  set(
                    list.map((x, j) =>
                      j === i ? { ...x, value: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              onClick={() => set(list.filter((_, j) => j !== i))}
              aria-label={"Remove " + label + " row"}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set([...list, { label: "", value: "" }])}
        >
          <Plus size={14} />
          Add row
        </button>
      </div>
    );
  }
  return (
    <section className="admin-editor">
      <h2>Product details & gallery</h2>
      <p>
        Save these details as a draft, then publish the product when you are
        ready.
      </p>
      {rows(spec, setSpec, "Technical specifications")}
      {rows(variants, setVariants, "Sizes & variants")}
      <h3>Gallery</h3>
      {gallery.map((mediaId, i) => (
        <div className="editor-columns" key={i}>
          <select
            aria-label={"Gallery image " + (i + 1)}
            value={mediaId}
            onChange={(e) =>
              setGallery(
                gallery.map((x, j) => (j === i ? Number(e.target.value) : x)),
              )
            }
          >
            {media.map((m) => (
              <option value={m.id} key={m.id}>
                {m.alt}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={!media.length}
        onClick={() => setGallery([...gallery, media[0].id])}
      >
        Add gallery image
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await clientApi("admin/details/" + id, csrf, "PUT", {
              specifications: spec,
              variants,
              gallery,
            });
            setNotice("Product details saved as draft.");
            onSaved();
          } catch (e) {
            setNotice((e as Error).message);
          }
        }}
      >
        Save product details
      </button>
      <form
        className="inquiry"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await clientApi(
              "admin/datasheet/" + id,
              csrf,
              "POST",
              new FormData(e.currentTarget),
            );
            setNotice(
              "Datasheet uploaded to draft. Publish the product to make it available.",
            );
            onSaved();
          } catch (e) {
            setNotice((e as Error).message);
          }
        }}
      >
        <label>
          Datasheet PDF (maximum 10 MB)
          <input name="file" type="file" accept="application/pdf" required />
        </label>
        <button>Upload datasheet</button>
      </form>
      <p role="status">{notice}</p>
    </section>
  );
}
export function FAQEditor({
  module,
  id,
  csrf,
  onSaved,
}: {
  module: string;
  id: number;
  csrf: string;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<FAQ[]>([]),
    [notice, setNotice] = useState("");
  useEffect(() => {
    clientApi<FAQ[]>("admin/faqs/" + module + "/" + id)
      .then(setItems)
      .catch((e) => setNotice(e.message));
  }, [module, id]);
  return (
    <section className="admin-editor">
      <h2>Helpful questions</h2>
      {items.map((r, i) => (
        <div key={i}>
          <label>
            Question
            <input
              value={r.question}
              onChange={(e) =>
                setItems(
                  items.map((x, j) =>
                    j === i ? { ...x, question: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <label>
            Answer
            <textarea
              value={r.answer}
              onChange={(e) =>
                setItems(
                  items.map((x, j) =>
                    j === i ? { ...x, answer: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            onClick={() => setItems(items.filter((_, j) => j !== i))}
          >
            Remove question
          </button>
        </div>
      ))}
      <div className="actions">
        <button
          type="button"
          onClick={() => setItems([...items, { question: "", answer: "" }])}
        >
          Add question
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await clientApi(
                "admin/faqs/" + module + "/" + id,
                csrf,
                "PUT",
                items,
              );
              setNotice(
                "Questions saved to draft. Publish the content to apply them.",
              );
              onSaved();
            } catch (e) {
              setNotice((e as Error).message);
            }
          }}
        >
          Save questions
        </button>
      </div>
      <p role="status">{notice}</p>
    </section>
  );
}
type Permission = {
  role: string;
  module: string;
  action: string;
  allowed: number;
};
const modules = [
  "pages",
  "categories",
  "products",
  "blogs",
  "careers",
  "media",
  "inquiries",
  "applications",
  "settings",
  "navigation",
  "system",
  "audit_logs",
];
const actions = ["read", "create", "update", "delete", "publish", "export"];
export function PermissionsEditor({ csrf }: { csrf: string }) {
  const [items, setItems] = useState<Permission[]>([]),
    [role, setRole] = useState("editor"),
    [notice, setNotice] = useState("");
  useEffect(() => {
    clientApi<Permission[]>("admin/permissions")
      .then(setItems)
      .catch((e) => setNotice(e.message));
  }, []);
  return (
    <div>
      <p>
        Override individual permissions or inherit the role’s defaults. Super
        administrators retain full access.
      </p>
      <label>
        Staff role
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {["admin", "editor", "catalogue_manager", "enquiry_manager"].map(
            (r) => (
              <option key={r}>{r}</option>
            ),
          )}
        </select>
      </label>
      <div style={{ overflowX: "auto" }}>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Module</th>
              {actions.map((a) => (
                <th key={a}>{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module}>
                <th>{module}</th>
                {actions.map((action) => {
                  const item = items.find(
                    (r) =>
                      r.role === role &&
                      r.module === module &&
                      r.action === action,
                  );
                  return (
                    <td key={action}>
                      <select
                        aria-label={`${role} ${module} ${action}`}
                        value={item ? String(item.allowed) : "inherit"}
                        onChange={(e) => {
                          const rest = items.filter(
                            (r) =>
                              !(
                                r.role === role &&
                                r.module === module &&
                                r.action === action
                              ),
                          );
                          setItems(
                            e.target.value === "inherit"
                              ? rest
                              : [
                                  ...rest,
                                  {
                                    role,
                                    module,
                                    action,
                                    allowed: Number(e.target.value),
                                  },
                                ],
                          );
                        }}
                      >
                        <option value="inherit">Default</option>
                        <option value="1">Allow</option>
                        <option value="0">Deny</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={async () => {
          try {
            await clientApi("admin/permissions", csrf, "PUT", items);
            setNotice("Permissions saved.");
          } catch (e) {
            setNotice((e as Error).message);
          }
        }}
      >
        Save permissions
      </button>
      <p role="status">{notice}</p>
    </div>
  );
}
export function AccountPanel({ csrf }: { csrf: string }) {
  const [notice, setNotice] = useState("");
  return (
    <form
      className="admin-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = e.currentTarget;
        try {
          await clientApi(
            "admin/password",
            csrf,
            "POST",
            Object.fromEntries(new FormData(f)),
          );
          f.reset();
          setNotice("Password changed. Other sessions have been revoked.");
        } catch (e) {
          setNotice((e as Error).message);
        }
      }}
    >
      <h2>Change your password</h2>
      <label>
        Current password
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <label>
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={14}
          maxLength={128}
        />
      </label>
      <p>Use at least 14 characters. Your current session stays active.</p>
      <button>Change password</button>
      <p role="status">{notice}</p>
    </form>
  );
}
export function SystemPanel({ csrf }: { csrf: string }) {
  const [state, setState] = useState<{
      php: string;
      gd: boolean;
      smtp_configured: boolean;
      counts: { pending_notifications: number; failed_notifications: number };
      retention_days: number;
    } | null>(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    clientApi<NonNullable<typeof state>>("admin/system")
      .then(setState)
      .catch((e) => setNotice(e.message));
  }, []);
  return (
    <div>
      <div className="system-grid">
        <div className="card">
          <h3>Runtime</h3>
          <strong>PHP {state?.php}</strong>
          <p>
            SQLite database ·{" "}
            {state?.gd
              ? "Image processing available"
              : "Image processing unavailable"}
          </p>
        </div>
        <div className="card">
          <h3>Email notifications</h3>
          <strong>{state?.counts.pending_notifications || 0}</strong>
          <p>
            {state?.smtp_configured ? "SMTP configured" : "SMTP not configured"}{" "}
            · {state?.counts.failed_notifications || 0} failed
          </p>
        </div>
        <div className="card">
          <h3>Data retention</h3>
          <strong>
            {state?.retention_days ? state.retention_days + " days" : "Manual"}
          </strong>
          <p>Set the approved retention period in the server configuration.</p>
        </div>
      </div>
      <section className="admin-editor">
        <h2>Private database backup</h2>
        <p>
          Download a consistent SQLite backup. Store it securely; it contains
          private enquiries and staff account records.
        </p>
        <button
          onClick={async () => {
            try {
              const r = await fetch("/api/v1/admin/backup", {
                method: "POST",
                headers: { "X-CSRF-Token": csrf },
              });
              if (!r.ok) throw Error("Backup failed");
              const url = URL.createObjectURL(await r.blob()),
                a = document.createElement("a");
              a.href = url;
              a.download = "stable-backup.sqlite";
              a.click();
              URL.revokeObjectURL(url);
              setNotice("Backup downloaded.");
            } catch (e) {
              setNotice((e as Error).message);
            }
          }}
        >
          <Download size={16} />
          Download backup
        </button>
      </section>
      <p role="status">{notice}</p>
    </div>
  );
}
