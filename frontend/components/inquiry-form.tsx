"use client";
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
          {k === "message"
            ? type === "quotes"
              ? "Materials, quantities and requirements"
              : "Your message"
            : k}
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
            Project location (optional)
            <input {...register("project_location")} maxLength={300} />
          </label>
          <label>
            Required date (optional)
            <input type="date" {...register("required_date")} />
          </label>
          <label>
            Material category (optional)
            <input {...register("category")} maxLength={200} />
          </label>
        </div>
      ) : (
        <label>
          Subject (optional)
          <input {...register("subject")} maxLength={200} />
        </label>
      )}
      {type === "quotes" && (
        <label>
          BOQ or material list PDF (optional, up to 5 MB)
          <input
            key={fileVersion}
            type="file"
            accept="application/pdf"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          />
        </label>
      )}
      <label className="honeypot" aria-hidden="true">
        Website
        <input {...register("website")} tabIndex={-1} autoComplete="off" />
      </label>
      <label className="check">
        <input type="checkbox" {...register("consent")} />I agree to be
        contacted regarding this enquiry.
      </label>
      {errors.consent && <p>Please acknowledge contact permission.</p>}
      <button disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </button>
      <p role="status">{notice}</p>
      <p>Final pricing and availability are confirmed by the team.</p>
    </form>
  );
}
