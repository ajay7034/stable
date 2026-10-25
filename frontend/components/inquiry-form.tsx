"use client";
import { useWebsite } from "@/components/website-provider";
import { WebsiteCopy } from "@/components/website-copy";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
const schema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(7),
  company: z.string(),
  subject: z.string().optional(),
  project_location: z.string().optional(),
  required_date: z.string().optional(),
  category: z.string().optional(),
  message: z.string().min(10),
  website: z.string(),
  consent: z.literal(true),
});
type Values = z.infer<typeof schema>;
export function InquiryForm({
  type,
  category = "",
}: {
  type: string;
  category?: string;
}) {
  const settings = useWebsite();
  const [notice, setNotice] = useState(""),
    [attachment, setAttachment] = useState<File | null>(null),
    [fileVersion, setFileVersion] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { category },
  });
  return (
    <form
      className="inquiry"
      onSubmit={handleSubmit(async (values) => {
        setNotice("");
        try {
          const payload = {
            ...values,
            items:
              type === "quotes"
                ? JSON.parse(localStorage.getItem("stable-quote") || "[]")
                : [],
          };
          const form = new FormData();
          form.append("payload", JSON.stringify(payload));
          if (attachment) form.append("attachment", attachment);
          const r = await fetch(`${basePath}/api/v1/` + type, {
            method: "POST",
            headers: attachment
              ? undefined
              : { "Content-Type": "application/json" },
            body: attachment ? form : JSON.stringify(payload),
          });
          if (!r.ok)
            throw Error(
              "Unable to send. Please check your details or contact us by phone.",
            );
          setNotice(
            "Thank you. Your enquiry has been received. Our team will confirm pricing and availability.",
          );
          reset();
          setAttachment(null);
          setFileVersion((v) => v + 1);
          if (type === "quotes") {
            localStorage.removeItem("stable-quote");
            window.dispatchEvent(new Event("stable-quote-updated"));
          }
        } catch (e) {
          setNotice((e as Error).message);
        }
      })}
    >
      {(["name", "email", "phone", "company", "message"] as const).map((k) => (
        <label key={k}>
          {settings[k === "message" ? (type === "quotes" ? "design_form_quote_message" : "design_form_message") : `design_form_${k}`] || k}
          {k === "message" ? (
            <textarea {...register(k)} rows={5} />
          ) : (
            <input {...register(k)} type={k === "email" ? "email" : "text"} />
          )}
          <span role="alert">{errors[k]?.message}</span>
        </label>
      ))}
      {type === "quotes" ? (
        <div className="editor-columns">
          <label>
            {settings.design_form_location}
            <input {...register("project_location")} maxLength={300} />
          </label>
          <label>
            {settings.design_form_date}
            <input type="date" {...register("required_date")} />
          </label>
          <label>
            {settings.design_form_category}
            <input {...register("category")} maxLength={200} />
          </label>
        </div>
      ) : (
        <label>
          {settings.design_form_subject}
          <input {...register("subject")} maxLength={200} />
        </label>
      )}
      {type === "quotes" && (
        <label>
          {settings.design_form_attachment}
          <input
            key={fileVersion}
            type="file"
            accept="application/pdf"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          />
        </label>
      )}
      <label className="honeypot" aria-hidden="true"><WebsiteCopy id="design_copy_ffc3e1fc47f2" fallback={"Website"} /><input {...register("website")} tabIndex={-1} autoComplete="off" />
      </label>
      <label className="check">
        <input type="checkbox" {...register("consent")} /><WebsiteCopy id="design_copy_3589dc21059b" fallback={"I agree to be contacted regarding this enquiry."} /></label>
      {errors.consent && <p><WebsiteCopy id="design_copy_6c703f07546e" fallback={"Please acknowledge contact permission."} /></p>}
      <button disabled={isSubmitting}>
        {isSubmitting ? settings.design_form_sending : settings.design_form_send}
      </button>
      <p role="status">{notice}</p>
      <p><WebsiteCopy id="design_copy_7ccc2ceff3b9" fallback={"Final pricing and availability are confirmed by the team."} /></p>
    </form>
  );
}
