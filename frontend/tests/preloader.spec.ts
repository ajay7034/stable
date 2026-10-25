import { test, expect } from "@playwright/test";
const home = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const loaded = async (page: import("@playwright/test").Page) => {
  await expect(page.getByTestId("page-preloader")).toHaveCount(0, { timeout: 6000 });
};

test("first visit shows the logo then restores an interactive page", async ({ page }) => {
  await page.goto(home, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("page-preloader").filter({ visible: true })).toBeVisible();
  await expect(page.locator(".preloader-mark-reveal").filter({ visible: true })).toHaveAttribute("src", /(logo-transparent\.png|\/api\/v1\/media\/\d+)$/);
  await page.waitForTimeout(650);
  await page.screenshot({ path: "test-results/preloader-desktop.png" });
  await loaded(page);
  await expect(page.locator("#site-content")).not.toHaveAttribute("inert", "");
  await expect(page.getByRole("heading", { name: "Built on trust. Ready for every project." })).toBeVisible();
});

test("internal links, query changes, and browser back replay the preloader", async ({ page }) => {
  await page.goto(home);
  await loaded(page);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "About", exact: true }).click();
  await expect(page.getByTestId("page-preloader").filter({ visible: true })).toBeVisible();
  await expect(page).toHaveURL(/\/about$/);
  await loaded(page);
  await page.getByRole("banner").getByRole("link", { name: "Stable Building Materials Trading LLC home" }).click();
  await loaded(page);
  await page.getByRole("link", { name: "Explore materials", exact: true }).click();
  await expect(page.getByTestId("page-preloader").filter({ visible: true })).toBeVisible();
  await loaded(page);
  await page.getByRole("textbox", { name: "Find a material" }).fill("cement");
  await page.getByRole("button", { name: "Find materials" }).click();
  await expect(page.getByTestId("page-preloader").filter({ visible: true })).toBeVisible();
  await loaded(page);
  await page.goBack();
  await expect(page.getByTestId("page-preloader").filter({ visible: true })).toBeVisible();
  await loaded(page);
});

test("same-page anchor links do not trigger a loader", async ({ page }) => {
  await page.goto(home);
  await loaded(page);
  await page.getByRole("link", { name: "Discover Stable" }).click();
  await expect(page.getByTestId("page-preloader")).toHaveCount(0);
});

test("reduced motion and no-JavaScript visitors can access the page", async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const page = await reduced.newPage();
  await page.goto(home);
  await loaded(page);
  await expect(page.locator("#site-content")).not.toHaveAttribute("inert", "");
  await reduced.close();
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noScript.newPage();
  await staticPage.goto(home);
  await expect(staticPage.getByTestId("page-preloader").filter({ visible: true })).toHaveCount(0);
  await expect(staticPage.getByRole("heading", { name: "Built on trust. Ready for every project." })).toBeVisible();
  await noScript.close();
});

test("mobile loader stays centered without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(home, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("page-preloader").filter({ visible: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/preloader-mobile.png" });
  await loaded(page);
});
