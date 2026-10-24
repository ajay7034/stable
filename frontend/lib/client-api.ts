export async function clientApi<T = unknown>(
  path: string,
  csrf = "",
  method = "GET",
  data?: unknown,
): Promise<T> {
  const form = data instanceof FormData;
  const response = await fetch("/api/v1/" + path, {
    method,
    headers: {
      ...(form ? {} : { "Content-Type": "application/json" }),
      "X-CSRF-Token": csrf,
    },
    body: data === undefined ? undefined : form ? data : JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) {
    const m =
      json.messages || json.message || "The request could not be completed.";
    throw new Error(typeof m === "string" ? m : Object.values(m).join(" · "));
  }
  return json.data;
}
