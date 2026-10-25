"use client";
import { WebsiteCopy } from "@/components/website-copy";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="page">
      <h1><WebsiteCopy id="design_copy_fe22d3562f56" fallback={"We’ll be right back."} /></h1>
      <p><WebsiteCopy id="design_copy_0e50948d1cb0" fallback={"Our content service is temporarily unavailable. Please try again."} /></p>
      <button onClick={reset}><WebsiteCopy id="design_copy_9e2e9f3ef0fe" fallback={"Try again"} /></button>
    </section>
  );
}
