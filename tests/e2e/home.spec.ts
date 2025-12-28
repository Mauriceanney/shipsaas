import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SaaS Boilerplate/);
  });

  test("displays hero section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Build your SaaS faster/i })
    ).toBeVisible();
  });

  test("has navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Login/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get Started/i })).toBeVisible();
  });

  test("displays features section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Features/i })
    ).toBeVisible();
  });
});
