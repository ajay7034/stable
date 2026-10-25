"use client";
import { WebsiteCopy } from "@/components/website-copy";

import { useEffect, useState } from "react";
type Item = { id: number; title: string; quantity: number };
export function QuoteList({
  product,
}: {
  product?: { id: number; title: string };
}) {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    function load() {
      try {
        const raw = JSON.parse(localStorage.getItem("stable-quote") || "[]");
        setItems(
          Array.isArray(raw)
            ? raw.filter(
                (i) =>
                  Number.isInteger(i.id) &&
                  typeof i.title === "string" &&
                  Number.isInteger(i.quantity) &&
                  i.quantity > 0,
              )
            : [],
        );
      } catch {
        setItems([]);
      }
    }
    load();
    window.addEventListener("stable-quote-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("stable-quote-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  function save(next: Item[]) {
    setItems(next);
    localStorage.setItem("stable-quote", JSON.stringify(next));
    window.dispatchEvent(new Event("stable-quote-updated"));
  }
  if (product)
    return (
      <button
        onClick={() => {
          const next = items.some((i) => i.id === product.id)
            ? items
            : items.concat({ ...product, quantity: 1 });
          save(next);
        }}
      >
        {items.some((i) => i.id === product.id)
          ? "Added to quote list"
          : "Add to quote list"}
      </button>
    );
  return (
    <div>
      <h2><WebsiteCopy id="design_copy_add98412d13d" fallback={"Your material list"} /></h2>
      {items.length ? (
        items.map((i) => (
          <div key={i.id} className="admin-row">
            <span>{i.title}</span>
            <label><WebsiteCopy id="design_copy_14386e8712e3" fallback={"Quantity"} /><input
                aria-label={"Quantity for " + i.title}
                type="number"
                min="1"
                max="100000"
                value={i.quantity}
                onChange={(e) =>
                  save(
                    items.map((x) =>
                      x.id === i.id
                        ? {
                            ...x,
                            quantity: Math.max(
                              1,
                              Math.min(100000, Number(e.target.value)),
                            ),
                          }
                        : x,
                    ),
                  )
                }
              />
            </label>
            <button onClick={() => save(items.filter((x) => x.id !== i.id))}><WebsiteCopy id="design_copy_d145731a1c3d" fallback={"Remove"} /></button>
          </div>
        ))
      ) : (
        <p><WebsiteCopy id="design_copy_c02744734737" fallback={"No selected products. Describe your requirements in the form below."} /></p>
      )}
    </div>
  );
}
