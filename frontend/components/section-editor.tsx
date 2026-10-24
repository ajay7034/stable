"use client";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

import { useEffect, useState } from "react";
type Section = {
  kind: string;
  heading: string;
  eyebrow: string;
  body: string;
  button_label: string;
  button_href: string;
  visible: number;
};
export function SectionEditor({
  page,
  csrf,
  onSaved,
}: {
  page: number;
  csrf: string;
  onSaved?: () => void;
}) {
  const [sections, setSections] = useState<Section[]>([]),
    [notice, setNotice] = useState(""),
    [versions, setVersions] = useState<
      { id: number; content: string; created_at: string }[]
    >([]);
  useEffect(() => {
    fetch(`${basePath}/api/v1/admin/sections/` + page)
      .then(async (r) => {
        if (!r.ok) throw Error("Unable to load sections");
        setSections((await r.json()).data);
      })
      .catch((e) => setNotice(e.message));
  }, [page]);
  function move(i: number, to: number) {
    const next = [...sections];
    [next[i], next[to]] = [next[to], next[i]];
    setSections(next);
  }
  return (
    <section>
      <h2>Page sections</h2>
      <p>
        Changes are saved to a draft. Publish the page when your sections are
        ready.
      </p>
      <button
        type="button"
        onClick={async () => {
          try {
            const r = await fetch(
              `${basePath}/api/v1/admin/versions/page_sections/` + page,
            );
            if (!r.ok) throw Error("Unable to load revisions");
            setVersions((await r.json()).data);
          } catch (e) {
            setNotice((e as Error).message);
          }
        }}
      >
        Section revision history
      </button>
      {versions.map((v) => (
        <div className="admin-row" key={v.id}>
          <span>{v.created_at} UTC</span>
          <button
            type="button"
            onClick={() => {
              setSections(JSON.parse(v.content));
              setNotice(
                "Previous sections loaded. Save sections to restore this draft.",
              );
            }}
          >
            Load previous sections
          </button>
        </div>
      ))}
      {sections.map((s, i) => (
        <div className="admin-editor" key={i}>
          <label>
            Layout
            <select
              value={s.kind}
              onChange={(e) =>
                setSections(
                  sections.map((x, j) =>
                    j === i ? { ...x, kind: e.target.value } : x,
                  ),
                )
              }
            >
              {[
                "intro",
                "categories",
                "cta",
                "values",
                "approach",
                "journal",
                "contact",
              ].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          {(
            [
              "heading",
              "eyebrow",
              "body",
              "button_label",
              "button_href",
            ] as const
          ).map((k) => (
            <label key={k}>
              {k}
              <textarea
                value={s[k]}
                onChange={(e) =>
                  setSections(
                    sections.map((x, j) =>
                      j === i ? { ...x, [k]: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
          ))}
          <label className="check">
            <input
              type="checkbox"
              checked={!!s.visible}
              onChange={(e) =>
                setSections(
                  sections.map((x, j) =>
                    j === i ? { ...x, visible: e.target.checked ? 1 : 0 } : x,
                  ),
                )
              }
            />
            Visible
          </label>
          <div className="actions">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
            >
              Move up
            </button>
            <button
              type="button"
              disabled={i === sections.length - 1}
              onClick={() => move(i, i + 1)}
            >
              Move down
            </button>
            <button
              type="button"
              onClick={() => setSections(sections.filter((_, j) => j !== i))}
            >
              Remove section
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setSections([
            ...sections,
            {
              kind: "intro",
              heading: "New section",
              eyebrow: "",
              body: "",
              button_label: "",
              button_href: "",
              visible: 0,
            },
          ])
        }
      >
        Add section
      </button>
      <button
        type="button"
        onClick={async () => {
          const r = await fetch(`${basePath}/api/v1/admin/sections/` + page, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrf,
            },
            body: JSON.stringify(sections),
          });
          if (r.ok) onSaved?.();
          setNotice(
            r.ok
              ? "Sections saved to draft"
              : JSON.stringify((await r.json()).messages),
          );
        }}
      >
        Save sections
      </button>
      <p role="status">{notice}</p>
    </section>
  );
}
