"use client";
import { useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { websiteImage } from "@/lib/website";
type Field = { key: string; label: string; group: string; type: string; default: string; min?: number; max?: number };
type Card = { title: string; body: string };
type Settings = { fields: Field[]; values: Record<string, string>; media: { id: number; alt: string; folder: string }[] };
export function WebsiteEditor({ csrf }: { csrf: string }) {
  const [data, setData] = useState<Settings | null>(null);
  const [group, setGroup] = useState("Images");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { clientApi<Settings>("admin/website").then(setData).catch((error) => setNotice(error.message)); }, []);
  const update = (key: string, value: string) => setData((current) => current ? { ...current, values: { ...current.values, [key]: value } } : current);
  if (!data) return <p role="status">{notice || "Loading website controls…"}</p>;
  const groups = Array.from(new Set(data.fields.map((field) => field.group)));
  return <div className="website-editor">
    <p>Manage the website’s imagery, About content, branding and motion. Select uploaded images from the media library. Website settings publish immediately; page content and sections retain their existing draft-and-publish workflow.</p>
    <nav className="website-editor-tabs" aria-label="Website settings groups">{groups.map((name) => <button key={name} type="button" aria-pressed={group === name} onClick={() => setGroup(name)}>{name}</button>)}</nav>
    <form onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setNotice("");
      try {
        const values = Object.fromEntries(data.fields.map((field) => [field.key, data.values[field.key] ?? field.default]));
        await clientApi("admin/website", csrf, "PUT", values);
        setNotice("Website settings published. Refresh the public website to see your changes.");
      } catch (error) { setNotice((error as Error).message); } finally { setBusy(false); }
    }}>
      <h2>{group}</h2>
      {data.fields.filter((field) => field.group === group).map((field) => {
        const value = data.values[field.key] ?? field.default;
        if (field.type === "cards") {
          let cards: Card[] = []; try { cards = JSON.parse(value); } catch {}
          const saveCards = (items: Card[]) => update(field.key, JSON.stringify(items));
          return <fieldset key={field.key} className="website-card-editor"><legend>{field.label}</legend>{cards.map((card, index) => <div key={index} className="website-card-row">
            <label>{field.label} {index + 1} title<input aria-label={`${field.label} ${index + 1} title`} value={card.title} maxLength={200} onChange={(event) => saveCards(cards.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} /></label>
            <label>{field.label} {index + 1} description<textarea aria-label={`${field.label} ${index + 1} description`} value={card.body} maxLength={1500} onChange={(event) => saveCards(cards.map((item, i) => i === index ? { ...item, body: event.target.value } : item))} /></label>
            <div className="row-actions"><button type="button" disabled={index === 0} onClick={() => { const next = [...cards]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; saveCards(next); }}>Move up</button><button type="button" disabled={index === cards.length - 1} onClick={() => { const next = [...cards]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; saveCards(next); }}>Move down</button><button type="button" onClick={() => saveCards(cards.filter((_, i) => i !== index))}>Remove card</button></div>
          </div>)}<button type="button" disabled={cards.length >= 12} onClick={() => saveCards([...cards, { title: "", body: "" }])}>Add {field.label.toLowerCase()}</button></fieldset>;
        }
        return <div className="website-field" key={field.key}><label>{field.label}
          {field.type === "image" ? <select aria-label={field.label} value={value} onChange={(event) => update(field.key, event.target.value)}><option value="">Use fallback / page cover</option>{data.media.map((image) => <option key={image.id} value={String(image.id)}>{image.alt || "Untitled image"}{image.folder ? ` — ${image.folder}` : ""}</option>)}</select>
            : field.type === "boolean" ? <select aria-label={field.label} value={value} onChange={(event) => update(field.key, event.target.value)}><option value="1">Enabled / visible</option><option value="0">Disabled / hidden</option></select>
            : ["number", "color"].includes(field.type) ? <input aria-label={field.label} type={field.type} value={value} min={field.min} max={field.max} onChange={(event) => update(field.key, event.target.value)} />
            : <textarea aria-label={field.label} rows={value.length > 120 ? 4 : 2} value={value} maxLength={5000} onChange={(event) => update(field.key, event.target.value)} />}
        </label>{field.type === "image" && value && <img className="website-image-preview" src={websiteImage(value)} alt={`${field.label} preview`} />}</div>;
      })}
      <div className="website-publish-bar"><button disabled={busy}>{busy ? "Publishing…" : "Publish website settings"}</button><p role="status">{notice}</p></div>
    </form>
  </div>;
}
