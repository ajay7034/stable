import { test, expect } from "@playwright/test";
const site = (process.env.TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const paths = ["about", "blogs", "careers", "contact", "request-quote", "products", "products/category/cement-products", "blogs/planning-a-material-list"];
async function open(page: import("@playwright/test").Page, path: string) {
  await page.goto(`${site}/${path}`);
  await expect(page.getByTestId("page-preloader")).toHaveCount(0, { timeout: 6000 });
}

test("public pages have loaded image heroes and a single readable heading", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of paths) {
    await open(page, path);
    const hero = page.locator(".inner-hero");
    await expect(hero).toBeVisible();
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(hero.locator("h1")).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect.poll(() => hero.locator("img").evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (path === "about" || path === "blogs") await page.screenshot({ path: `test-results/inner-hero-${path}.png` });
  }
});

test("About replaces empty space with helpful enquiry content", async ({ page }) => {
  await open(page, "about");
  await expect(page.locator(".about-support li")).toHaveCount(3);
  await expect(page.locator(".about-step")).toHaveCount(3);
  await page.locator(".about-step").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".about-step").last()).toHaveCSS("opacity", "1");
  await page.locator(".about-enquiry-card").scrollIntoViewIfNeeded();
  await expect(page.locator(".about-enquiry-card")).toHaveCSS("opacity", "1");
  await expect(page.locator(".about-enquiry-card").getByRole("link", { name: "Start a conversation" })).toHaveAttribute("href", /\/contact$/);
  const emptySections = await page.locator("main section").evaluateAll((sections) => sections.filter((section) => !section.textContent?.trim() && !section.querySelector("img,form")).length);
  expect(emptySections).toBe(0);
  await page.screenshot({ path: "test-results/about-enquiry-content.png" });
});

test("mobile heroes fit the screen and keep navigation readable", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["about", "blogs", "contact", "products"]) {
    await open(page, path);
    await expect(page.locator(".inner-hero h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (path === "about") await page.screenshot({ path: "test-results/inner-hero-mobile.png" });
  }
});

test("reduced motion stops hero zoom while retaining the backgrounds", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "about");
  await expect(page.locator(".inner-hero-background img")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".about-support")).toHaveCSS("opacity", "1");
});
