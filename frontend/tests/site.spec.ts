import { test, expect } from "@playwright/test";
for (const width of [360, 390, 768, 1024, 1440, 1920])
  test(`homepage at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Built on trust. Ready for every project.",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await expect(
      page
        .getByRole("banner")
        .getByRole("img", { name: "Stable company logo" }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  });
test("categories and published isolation", async ({ request }) => {
  const r = await request.get("/api/v1/categories");
  expect(r.status()).toBe(200);
  expect((await r.json()).data).toHaveLength(8);
  expect((await request.get("/api/v1/pages/privacy-policy")).status()).toBe(
    404,
  );
  expect((await request.get("/api/v1/admin/inquiries")).status()).toBe(403);
});
test("validation and CSRF reject invalid requests", async ({ request }) => {
  expect((await request.post("/api/v1/contact", { data: {} })).status()).toBe(
    400,
  );
  expect(
    (
      await request.post("/api/v1/auth/login", {
        data: { email: "bad", password: "bad" },
      })
    ).status(),
  ).toBe(403);
});
test("contact form persists an enquiry", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("name", { exact: true }).fill("Automated smoke test");
  await page.getByLabel("email", { exact: true }).fill("test@example.invalid");
  await page.getByLabel("phone", { exact: true }).fill("+971500000000");
  await page
    .getByLabel("Your message")
    .fill("Automated test enquiry for local validation only.");
  await page.getByLabel("I agree").check();
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("has been received");
});
for(const width of [390,1440]) test(`inner pages and browser errors at ${width}px`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});
 for(const path of ['/about','/products','/products/category/ceramics-tiles','/blogs','/blogs/planning-a-material-list','/careers','/contact','/request-quote']){
  const response=await page.goto(path);expect(response?.status(),path).toBe(200);await expect(page.locator('main h1').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBeTruthy();
 }
 expect(errors).toEqual([]);
});
