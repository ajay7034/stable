import { test, expect } from "@playwright/test";
test("staff workspace media upload and draft editing", async ({ page }) => {
  test.skip(
    !process.env.TEST_STAFF_PASSWORD,
    "Run through backend/tests/smoke.py with RUN_BROWSER_TESTS=1",
  );
  await page.goto("/admin");
  await page
    .getByLabel("Email", { exact: true })
    .fill("smoke-admin@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.TEST_STAFF_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your workspace." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Media library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Media library" }),
  ).toBeVisible();
  await page
    .getByLabel("Image", { exact: true })
    .setInputFiles("public/logo.png");
  await page.getByLabel("alt", { exact: true }).fill("Browser smoke image");
  await page.getByLabel("owner", { exact: true }).fill("Fixture owner");
  await page.getByLabel("license", { exact: true }).fill("Test fixture");
  await page.getByRole("button", { name: "Upload authorized image" }).click();
  await expect(
    page.getByRole("heading", { name: "Browser smoke image" }),
  ).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Delete Browser smoke image" })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Browser smoke image" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Browser smoke draft");
  await page
    .getByLabel("URL slug", { exact: true })
    .fill("browser-smoke-draft");
  await page
    .getByLabel("Short description", { exact: true })
    .fill("Private draft created by the browser test.");
  await page
    .getByLabel("Availability", { exact: true })
    .selectOption("enquire");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByText("Browser smoke draft", { exact: true }),
  ).toBeVisible();
  await page.screenshot({path:'test-results/admin-studio.png',fullPage:true});
  await page.goto('/products/smoke-private-product');
  await expect(page.getByRole('heading',{name:'Smoke scheduled product',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:/datasheet/i})).toBeVisible();
  await page.goto('/careers/smoke-job');
  await expect(page.getByRole('heading',{name:'Apply for this role'})).toBeVisible();
  await page.goto('/admin');
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});
