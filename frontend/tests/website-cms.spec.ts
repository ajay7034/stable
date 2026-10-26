import { test, expect, type APIRequestContext, type Cookie } from "@playwright/test";
import { readFileSync } from "node:fs";
const site = (process.env.TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const accounts = process.env.CMS_TEST_ACCESS_FILE ? JSON.parse(readFileSync(process.env.CMS_TEST_ACCESS_FILE, "utf8")) : {};
test.describe.configure({ mode: "serial" });
test.skip(!process.env.CMS_TEST_ACCESS_FILE, "Requires private, disposable CMS test accounts and an isolated database.");
let adminCookies: Cookie[] = [];
test.beforeEach(async ({ page }) => { if (adminCookies.length) await page.context().addCookies(adminCookies); });
async function signIn(request: APIRequestContext, role = "admin") {
  const session = (await (await request.get(`${site}/api/v1/auth/session`)).json()).data;
  if (session.user?.email === accounts[role].email) return session.csrf as string;
  const login = await request.post(`${site}/api/v1/auth/login`, { headers: { "X-CSRF-Token": session.csrf }, data: accounts[role] });
  expect(login.status()).toBe(200);
  return (await login.json()).data.csrf as string;
}
async function settings(request: APIRequestContext) { return (await (await request.get(`${site}/api/v1/admin/website`)).json()).data; }
async function save(request: APIRequestContext, csrf: string, data: Record<string, unknown>) {
  return request.put(`${site}/api/v1/admin/website`, { headers: { "X-CSRF-Token": csrf }, data });
}

test("administrator can log in and publish About text from Website design", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto(`${site}/admin`);
  await expect(page.getByTestId("page-preloader")).toHaveCount(0, { timeout: 6000 });
  await page.getByLabel("Email", { exact: true }).fill(accounts.admin.email);
  await page.getByLabel("Password", { exact: true }).fill(accounts.admin.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your workspace." })).toBeVisible();
  adminCookies = await page.context().cookies();
  const original = (await settings(page.request)).values.design_about_process_heading;
  const session = (await (await page.request.get(`${site}/api/v1/auth/session`)).json()).data;
  try {
    await page.getByRole("button", { name: "Website design", exact: true }).click();
    await page.getByRole("button", { name: "About page", exact: true }).click();
    await page.getByLabel("Process heading", { exact: true }).fill("CMS verification: your project, your next step.", { timeout: 5000 });
    await expect(page.getByLabel("Process heading", { exact: true })).toHaveValue("CMS verification: your project, your next step.");
    await page.getByRole("button", { name: "Publish website settings", exact: true }).click();
    await expect(page.getByText("Website settings published. Refresh the public website to see your changes.")).toBeVisible();
    await page.screenshot({ path: "test-results/cms-website-editor.png", fullPage: true });
    await page.goto(`${site}/about`);
    await expect(page.getByTestId("page-preloader")).toHaveCount(0, { timeout: 6000 });
    await expect(page.getByRole("heading", { name: "CMS verification: your project, your next step." })).toHaveCount(1);
  } finally { expect((await save(page.request, session.csrf, { design_about_process_heading: original })).status()).toBe(200); }
});

test("website changes require permissions and CSRF and invalid updates are atomic", async ({ page, request }) => {
  expect((await request.get(`${site}/api/v1/admin/website`)).status()).toBe(403);
  const csrf = await signIn(page.request);
  const before = await settings(page.request);
  expect(before.fields.length).toBeGreaterThan(150);
  expect((await page.request.put(`${site}/api/v1/admin/website`, { data: { design_color_gold: "#ffffff" } })).status()).toBe(403);
  for (const bad of [{ design_color_gold: "url(javascript:bad)" }, { design_hero_about_image: "9999999" }, { design_home_slider_interval: "0" }, { design_about_cta_href: "javascript:alert(1)" }, { design_about_process_cards: '[{"title":"x","body":"y","html":"bad"}]' }]) {
    expect((await save(page.request, csrf, { design_about_process_heading: "Must not be saved", ...bad })).status()).toBe(400);
  }
  expect((await settings(page.request)).values.design_about_process_heading).toBe(before.values.design_about_process_heading);
  expect((await page.request.put(`${site}/api/v1/admin/settings`, { headers: { "X-CSRF-Token": csrf }, data: { design_home_slider_interval: "0" } })).status()).toBe(400);
  await signIn(request, "editor");
  expect((await request.get(`${site}/api/v1/admin/website`)).status()).toBe(403);
});

test("uploaded images stay private until published and cannot be deleted while selected", async ({ page, request }) => {
  const csrf = await signIn(page.request);
  const before = await settings(page.request);
  const alt = `CMS test image ${Date.now()}`;
  const response = await page.request.post(`${site}/api/v1/admin/media`, { headers: { "X-CSRF-Token": csrf }, multipart: { file: { name: "logo.png", mimeType: "image/png", buffer: readFileSync("public/logo-transparent.png") }, alt, owner: "Validation fixture", license: "User-supplied logo used only in isolated tests", source_url: "", folder: "Validation" } });
  expect(response.status()).toBe(201);
  const files = (await (await page.request.get(`${site}/api/v1/admin/media`)).json()).data;
  const id = files.find((file: { alt: string }) => file.alt === alt).id;
  try {
    expect((await request.get(`${site}/api/v1/media/${id}`)).status()).toBe(404);
    expect((await save(page.request, csrf, { design_hero_about_image: String(id) })).status()).toBe(200);
    expect((await request.get(`${site}/api/v1/media/${id}`)).status()).toBe(200);
    expect((await page.request.delete(`${site}/api/v1/admin/media/${id}`, { headers: { "X-CSRF-Token": csrf } })).status()).toBe(409);
    await page.goto(`${site}/about`);
    await expect(page.locator(".inner-hero-background img")).toHaveAttribute("src", new RegExp(`/media/${id}$`));
  } finally {
    expect((await save(page.request, csrf, { design_hero_about_image: before.values.design_hero_about_image })).status()).toBe(200);
    expect((await page.request.delete(`${site}/api/v1/admin/media/${id}`, { headers: { "X-CSRF-Token": csrf } })).status()).toBe(200);
  }
});

test("motion and interface wording controls update the website without a build", async ({ page }) => {
  const csrf = await signIn(page.request);
  const before = await settings(page.request);
  const key = before.fields.find((field: { label: string }) => field.label === "Home").key;
  const changed = { design_preloader_enabled: "0", design_scroll_animations_enabled: "0", design_inner_hero_zoom_enabled: "0", design_home_slider_interval: "6000", [key]: "Start here" };
  try {
    expect((await save(page.request, csrf, changed)).status()).toBe(200);
    await page.goto(`${site}/about`);
    await expect(page.getByTestId("page-preloader")).toHaveCount(0);
    await expect(page.locator(".inner-hero-background img")).toHaveCSS("animation-name", "none");
    await expect(page.locator(".reveal-ready")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Start here" })).toBeVisible();
    await page.goto(site);
    await expect(page.locator(".hero-slideshow")).toHaveCSS("--hero-slide-duration", "6000ms");
  } finally { expect((await save(page.request, csrf, Object.fromEntries(Object.keys(changed).map((name) => [name, before.values[name]])))).status()).toBe(200); }
});

test("page drafts remain isolated and publishing applies cover images and content", async ({ page, request }) => {
  const csrf = await signIn(page.request);
  const rows = (await (await page.request.get(`${site}/api/v1/admin/pages`)).json()).data;
  const about = rows.find((row: { slug: string }) => row.slug === "about");
  const initial = (await (await request.get(`${site}/api/v1/pages/about`)).json()).data;
  const website = await settings(page.request);
  const put = (data: object) => page.request.put(`${site}/api/v1/admin/pages/${about.id}`, { headers: { "X-CSRF-Token": csrf }, data });
  try {
    expect((await put({ ...about, description: "Isolated CMS draft verification", cover_id: Number(website.values.design_hero_contact_image), status: "draft" })).status()).toBe(200);
    expect((await (await request.get(`${site}/api/v1/pages/about`)).json()).data.description).toBe(initial.description);
    expect((await put({ ...about, description: "Isolated CMS publication verification", cover_id: Number(website.values.design_hero_contact_image), status: "published" })).status()).toBe(200);
    expect((await (await request.get(`${site}/api/v1/pages/about`)).json()).data.description).toBe("Isolated CMS publication verification");
    await page.goto(`${site}/about`);
    await expect(page.locator(".inner-hero-background img")).toHaveAttribute("src", new RegExp(`/media/${website.values.design_hero_contact_image}$`));
  } finally { expect((await put(about)).status()).toBe(200); }
});

test("brands and SBM publish from admin, hidden logo media stays protected and invalid entries are rejected", async ({ page, request }) => {
  test.setTimeout(90000);
  const csrf = await signIn(page.request);
  const before = await settings(page.request);
  const logos = JSON.parse(before.values.design_brand_logos);
  expect(logos).toHaveLength(83);
  const changed = [ { ...logos[2], name: "CMS brand verification" }, { ...logos[0], visible: false } ];
  try {
    for (const bad of ['{}', '[{"name":"Bad","image":"9999999","visible":true}]', '[{"name":"Bad","image":"javascript:alert(1)","visible":true}]', JSON.stringify([{...logos[0],html:"invalid"}])]) {
      expect((await save(page.request, csrf, { design_brand_logos: bad })).status()).toBe(400);
    }
    expect((await save(page.request, csrf, { design_contact_whatsapp: "javascript:bad" })).status()).toBe(400);
    expect((await save(page.request, csrf, { design_brand_logos: JSON.stringify(changed), design_sbm_heading: "CMS own brand verification" })).status()).toBe(200);
    await page.goto(site);
    await expect(page.locator(".brand-logo-set:not([aria-hidden]) img")).toHaveCount(1);
    await expect(page.locator(".brand-logo-set:not([aria-hidden]) img")).toHaveAttribute("alt", "CMS brand verification");
    await expect(page.getByRole("heading", {name:"CMS own brand verification"})).toBeAttached();
    // First logo is also selected as SBM feature, so use the hidden entry below with another image.
    const hidden = [{ ...logos[1], visible:false }];
    expect((await save(page.request, csrf, { design_brand_logos: JSON.stringify(hidden) })).status()).toBe(200);
    expect((await request.get(`${site}/api/v1/media/${logos[1].image}`)).status()).toBe(404);
    expect((await page.request.delete(`${site}/api/v1/admin/media/${logos[1].image}`, { headers:{"X-CSRF-Token":csrf} })).status()).toBe(409);
    expect((await save(page.request, csrf, { design_brand_logos: before.values.design_brand_logos })).status()).toBe(200);
    await page.goto(`${site}/admin`);
    await page.getByRole("button", {name:"Website design",exact:true}).click();
    await page.getByRole("button", {name:"Brands & SBM",exact:true}).click();
    await expect(page.getByLabel("Brand 1 name",{exact:true})).toHaveValue("SBM");
    await page.getByRole("button", {name:"Add brand logo",exact:true}).click();
    await expect(page.getByLabel("Brand 84 name",{exact:true})).toHaveValue("New brand");
    await page.locator(".website-logo-list details").last().locator("summary").click();
    await page.getByRole("button", {name:"Remove logo",exact:true}).click();
    await page.getByLabel("SBM heading",{exact:true}).fill("Published from the brand editor");
    await page.getByRole("button",{name:"Publish website settings",exact:true}).click();
    await expect(page.getByText("Website settings published. Refresh the public website to see your changes.")).toBeVisible();
    await page.goto(site);
    await expect(page.getByRole("heading",{name:"Published from the brand editor"})).toBeAttached();
  } finally {
    expect((await save(page.request, csrf, { design_brand_logos: before.values.design_brand_logos, design_sbm_heading: before.values.design_sbm_heading })).status()).toBe(200);
  }
});
