import type { ReactNode } from "react";
type Node = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: Node[];
};
export function richDocument(value: string): Node | null {
  try {
    const d = JSON.parse(value);
    return d?.type === "doc" ? d : null;
  } catch {
    return null;
  }
}
export function textContent(value: string): string {
  const d = richDocument(value);
  if (!d) return value;
  function text(n: Node): string {
    return n.text || n.content?.map(text).join(" ") || "";
  }
  return text(d);
}
export function headings(value: string): { id: string; text: string }[] {
  const d = richDocument(value);
  if (d) {
    const nodes: Node[] = [];
    function walk(n: Node) {
      if (n.type === "heading") nodes.push(n);
      n.content?.forEach(walk);
    }
    walk(d);
    return nodes.map((n, i) => ({
      id: "section-" + i,
      text: n.content?.map((c) => c.text || "").join("") || "",
    }));
  }
  return value
    .split(/\n\s*\n/)
    .filter((p) => p.includes("\n"))
    .map((p, i) => ({ id: "section-" + i, text: p.split("\n")[0] }));
}
export function RichText({ value }: { value: string }) {
  const d = richDocument(value);
  let index = 0;
  if (!d)
    return (
      <div className="prose">
        {value.split(/\n\s*\n/).map((part, i) => {
          const lines = part.split("\n");
          if (lines.length > 1 && lines[0].length < 110) {
            const id = "section-" + index++;
            return (
              <section key={i}>
                <h2 id={id}>{lines[0]}</h2>
                <p>{lines.slice(1).join("\n")}</p>
              </section>
            );
          }
          return <p key={i}>{part}</p>;
        })}
      </div>
    );
  function render(n: Node, key: number, depth = 0): ReactNode {
    if (depth > 20) return null;
    const children = n.content?.map((c, i) => render(c, i, depth + 1));
    if (n.type === "text") {
      let text: ReactNode = n.text;
      for (const m of n.marks || []) {
        if (m.type === "bold") text = <strong>{text}</strong>;
        if (m.type === "italic") text = <em>{text}</em>;
        if (m.type === "strike") text = <s>{text}</s>;
        if (m.type === "code") text = <code>{text}</code>;
        if (m.type === "underline") text = <u>{text}</u>;
        if (m.type === "link") {
          const href = String(m.attrs?.href || "");
          if (/^(https?:\/\/|mailto:|\/[a-z0-9])/i.test(href))
            text = (
              <a href={href} rel="noopener noreferrer">
                {text}
              </a>
            );
        }
      }
      return <span key={key}>{text}</span>;
    }
    if (n.type === "heading") {
      const id = "section-" + index++;
      return Number(n.attrs?.level) === 3 ? (
        <h3 id={id} key={key}>
          {children}
        </h3>
      ) : (
        <h2 id={id} key={key}>
          {children}
        </h2>
      );
    }
    switch (n.type) {
      case "paragraph":
        return <p key={key}>{children}</p>;
      case "bulletList":
        return <ul key={key}>{children}</ul>;
      case "orderedList":
        return <ol key={key}>{children}</ol>;
      case "listItem":
        return <li key={key}>{children}</li>;
      case "blockquote":
        return <blockquote key={key}>{children}</blockquote>;
      case "codeBlock":
        return (
          <pre key={key}>
            <code>{children}</code>
          </pre>
        );
      case "hardBreak":
        return <br key={key} />;
      case "horizontalRule":
        return <hr key={key} />;
      default:
        return <div key={key}>{children}</div>;
    }
  }
  return <div className="prose">{render(d, 0)}</div>;
}
