import { test, expect } from "@playwright/test";
const home = process.env.TEST_BASE_URL || "/";

test("hero cycles through both scenes and can be paused", async ({ page }) => {
  await page.goto(home);
  await expect(page.locator(".reveal-ready").first()).toBeAttached();
  const second = page.getByRole("button", { name: "Show architectural image 2" });
  await expect(second).toHaveAttribute("aria-pressed", "true", { timeout: 6500 });
  await expect(page.getByRole("button", { name: "Show architectural image 1" })).toHaveAttribute("aria-pressed", "true", { timeout: 6500 });
  await page.getByRole("button", { name: "Pause background slideshow" }).click();
  const count = await page.locator(".hero-slide-count").textContent();
  await page.waitForTimeout(3600);
  await expect(page.locator(".hero-slide-count")).toHaveText(count!);
  await page.getByRole("button", { name: "Show architectural image 2" }).click();
  await expect(page.locator(".hero-slide.is-active img")).toHaveJSProperty("complete", true);
  await expect.poll(() => page.locator(".hero-slide.is-active img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

test("cards reveal individually when scrolled into view", async ({ page }) => {
  await page.goto(home);
  const cards = page.locator(".category-card");
  await expect(cards.first()).toHaveClass(/reveal-ready/);
  await expect(cards.last()).not.toHaveClass(/reveal-visible/);
  await cards.first().scrollIntoViewIfNeeded();
  await expect(cards.first()).toHaveClass(/reveal-visible/);
  await expect(cards.first()).toHaveCSS("opacity", "1");
  await cards.last().scrollIntoViewIfNeeded();
  await expect(cards.last()).toHaveClass(/reveal-visible/);
});

test("reduced motion keeps content visible and stops autoplay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(home);
  await expect(page.locator(".hero-slideshow")).toHaveAttribute("data-playing", "false");
  await expect(page.getByRole("button", { name: "Pause background slideshow" })).toBeDisabled();
  await expect(page.locator(".intro-copy")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-content h1")).toHaveCSS("animation-name", "none");
});

test("mobile hero fits the viewport and has usable controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(home);
  await page.getByRole("button", { name: "Pause background slideshow" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const size = await page.getByRole("button", { name: "Play background slideshow" }).boundingBox();
  expect(size?.width).toBeGreaterThanOrEqual(44);
  expect(size?.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: "test-results/motion-mobile.png", fullPage: true });
});
