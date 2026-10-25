"use client";
import { useWebsite } from "@/components/website-provider";
import { WebsiteCopy } from "@/components/website-copy";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

import { useState } from "react";
export function ApplicationForm({ job }: { job: number }) {
  const settings = useWebsite();
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
          setNotice(settings.design_form_application_success);
          form.reset();
        } catch (e) {
          setNotice((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2><WebsiteCopy id="design_copy_7a7b742f0af1" fallback={"Apply for this role"} /></h2>
      {["name", "email", "phone"].map((k) => (
        <label key={k}>
          {settings[`design_form_${k}`] || k}
          <input
            name={k}
            type={k === "email" ? "email" : "text"}
            required
            maxLength={k === "phone" ? 40 : 150}
          />
        </label>
      ))}
      <label><WebsiteCopy id="design_copy_baf554857654" fallback={"Cover message"} /><textarea name="message" required minLength={10} maxLength={10000} />
      </label>
      <label>
        {settings.design_form_resume}
        <input name="resume" type="file" accept=".pdf,.doc,.docx" />
      </label>
      <label className="honeypot" aria-hidden="true"><WebsiteCopy id="design_copy_3d63ca3650d1" fallback={"Website"} /><input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="check">
        <input type="checkbox" name="consent" value="true" required /><WebsiteCopy id="design_copy_1290abafcf6f" fallback={"I agree to be contacted regarding this application."} /></label>
      <button disabled={busy}>
        {busy ? settings.design_form_applying : settings.design_form_apply}
      </button>
      <p role="status">{notice}</p>
    </form>
  );
}
