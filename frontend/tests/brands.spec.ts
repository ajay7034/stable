import { test, expect } from "@playwright/test";
const site = (process.env.TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

test("brand collection follows the hero, moves right and can pause", async ({ page }) => {
  await page.goto(site);
  const section = page.locator(".brand-showcase");
  await section.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const order = await page.locator("main").evaluate((main) => Array.from(main.children).slice(0, 3).map((node) => node.className));
  expect(order).toEqual(["hero", "brand-showcase", "sbm-feature section-wrap"]);
  await expect(section.locator("ul:not([aria-hidden]) li")).toHaveCount(83);
  await expect(section.locator("ul:not([aria-hidden]) img").first()).toHaveAttribute("alt", "SBM");
  await expect(section.locator(".brand-marquee")).toHaveAttribute("data-paused", "false");
  const x = () => section.locator(".brand-track").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  const before = await x(); await page.waitForTimeout(400); expect(await x()).toBeGreaterThan(before);
  await page.getByRole("button", { name: "Pause brand carousel" }).click();
  await expect(section.locator(".brand-track")).toHaveCSS("animation-play-state", "paused");
  const still = await x(); await page.waitForTimeout(250); expect(await x()).toBe(still);
  await page.getByRole("button", { name: "Play brand carousel" }).click();
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await expect(section.locator(".brand-marquee")).toHaveAttribute("data-paused", "true");
});

test("SBM and phone contacts work on mobile without overflow or floating overlap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(site);
  await page.locator(".sbm-feature").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Electrical essentials", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plywood & boards", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator(".floating-whatsapp")).toHaveAttribute("href", "https://wa.me/971505698227");
  await expect(page.locator(".utility").getByRole("link", { name: "+971 50 569 8227" })).toBeVisible();
  await page.evaluate(() => { localStorage.setItem("stable-quote", JSON.stringify([{id:1,title:"Test",quantity:1}])); window.dispatchEvent(new Event("stable-quote-updated")); });
  const whatsapp = await page.locator(".floating-whatsapp").boundingBox();
  const quote = await page.locator(".floating-quote").boundingBox();
  expect(quote!.x + quote!.width).toBeLessThanOrEqual(whatsapp!.x);
  await page.goto(`${site}/contact`);
  await expect(page.locator(".contact-details a[href='tel:+971505698227']")).toBeVisible();
});

test("reduced-motion and no-JavaScript visitors see the brands", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(site);
  await expect(page.locator(".brand-track")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".brand-logo-set[aria-hidden]")).toBeHidden();
  await expect(page.locator(".brand-logo-set:not([aria-hidden]) img").last()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
