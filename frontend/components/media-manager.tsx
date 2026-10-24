"use client";
import { useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { Search, Upload, ImageIcon, Trash2 } from "lucide-react";
type Media = {
  id: number;
  alt: string;
  owner: string;
  license: string;
  source_url: string;
  folder: string;
  width: number;
  height: number;
  size: number;
};
export function MediaManager({ csrf }: { csrf: string }) {
  const [items, setItems] = useState<Media[]>([]),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [folder, setFolder] = useState(""),
    [edit, setEdit] = useState<Media | null>(null);
  async function load() {
    setItems(
      await clientApi<Media[]>("admin/media?q=" + encodeURIComponent(query)),
    );
  }
  useEffect(() => {
    load().catch((e) => setNotice(e.message));
  }, []);
  const fields = ["alt", "owner", "license", "source_url", "folder"];
  return (
    <div>
      <p>
        Upload authorized JPEG, PNG or WebP images, up to 5 MB and 24
        megapixels. Files are re-encoded as WebP and thumbnails are created.
        Images stay private until used in published content.
      </p>
      <form
        className="admin-editor"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          try {
            await clientApi("admin/media", csrf, "POST", new FormData(form));
            form.reset();
            await load();
            setNotice("Image uploaded.");
          } catch (e) {
            setNotice((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Image
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </label>
        <div className="editor-columns">
          {fields.map((k) => (
            <label key={k}>
              {k.replace("_", " ")}
              <input
                name={k}
                required={!["source_url", "folder"].includes(k)}
                type={k === "source_url" ? "url" : "text"}
              />
            </label>
          ))}
        </div>
        <button disabled={busy}>
          <Upload size={16} />
          {busy ? "Uploading…" : "Upload authorized image"}
        </button>
      </form>
      <p role="status">{notice}</p>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          load().catch((e) => setNotice(e.message));
        }}
      >
        <label>
          Find an image
          <input
            aria-label="Search images"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Folder
          <select value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">All folders</option>
            {[...new Set(items.map((m) => m.folder).filter(Boolean))].map(
              (f) => (
                <option key={f}>{f}</option>
              ),
            )}
          </select>
        </label>
        <button>
          <Search size={15} />
          Search
        </button>
      </form>
      {edit && (
        <form
          className="admin-editor"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await clientApi("admin/media/" + edit.id, csrf, "PUT", edit);
              setEdit(null);
              await load();
              setNotice("Image metadata updated.");
            } catch (e) {
              setNotice((e as Error).message);
            }
          }}
        >
          <h3>Edit image information</h3>
          {fields.map((k) => (
            <label key={k}>
              {k.replace("_", " ")}
              <input
                value={String(edit[k as keyof Media] || "")}
                required={!["source_url", "folder"].includes(k)}
                type={k === "source_url" ? "url" : "text"}
                onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
              />
            </label>
          ))}
          <div className="actions">
            <button>Save image information</button>
            <button type="button" onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="category-grid">
        {items
          .filter((m) => !folder || m.folder === folder)
          .map((m) => (
            <div className="card media-card" key={m.id}>
              <img
                src={"/api/v1/media/" + m.id + "?size=thumb"}
                alt={m.alt}
                style={{ width: "100%", height: 180, objectFit: "cover" }}
              />
              <h3>{m.alt}</h3>
              <p>
                {m.width} × {m.height} · {Math.round(m.size / 1024)} KB
                <br />
                {m.folder || "Unfiled"}
              </p>
              <p>
                {m.owner}
                <br />
                {m.license}
              </p>
              <div className="actions">
                <button onClick={() => setEdit(m)}>Edit details</button>
                <button
                  aria-label={"Delete " + m.alt}
                  onClick={async () => {
                    if (!confirm("Permanently delete this unused image?"))
                      return;
                    try {
                      await clientApi("admin/media/" + m.id, csrf, "DELETE");
                      await load();
                      setNotice("Image deleted.");
                    } catch (e) {
                      setNotice((e as Error).message);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
