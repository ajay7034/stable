"use client";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

import { useState } from "react";
export function ApplicationForm({ job }: { job: number }) {
  const [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="inquiry"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        try {
          const r = await fetch(`${basePath}/api/v1/apply/` + job, {
            method: "POST",
            body: new FormData(form),
          });
          const j = await r.json();
          if (!r.ok) throw Error(JSON.stringify(j.messages));
          setNotice("Your application has been received.");
          form.reset();
        } catch (e) {
          setNotice((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Apply for this role</h2>
      {["name", "email", "phone"].map((k) => (
        <label key={k}>
          {k}
          <input
            name={k}
            type={k === "email" ? "email" : "text"}
            required
            maxLength={k === "phone" ? 40 : 150}
          />
        </label>
      ))}
      <label>
        Cover message
        <textarea name="message" required minLength={10} maxLength={10000} />
      </label>
      <label>
        Resume PDF, DOC or DOCX (optional, up to 5 MB)
        <input name="resume" type="file" accept=".pdf,.doc,.docx" />
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="check">
        <input type="checkbox" name="consent" value="true" required />I agree to
        be contacted regarding this application.
      </label>
      <button disabled={busy}>
        {busy ? "Submitting…" : "Submit application"}
      </button>
      <p role="status">{notice}</p>
    </form>
  );
}
