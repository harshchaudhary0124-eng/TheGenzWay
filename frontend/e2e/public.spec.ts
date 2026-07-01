import { test, expect } from "@playwright/test";

/** Public pages, marketing-page buttons/links, and auth-form button behaviour
 *  (no backend writes — these verify navigation + client-side validation). */
test.describe("Public navigation & buttons", () => {
  test("landing page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/Refuse|Build|GenZ|builders/i);
  });

  test("Nav → About", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/about"]').first().click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test("Nav → Community", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/community"]').first().click();
    await expect(page).toHaveURL(/\/community$/);
  });

  test("Hero CTA → Join", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Join The Movement/i }).click();
    await expect(page).toHaveURL(/\/join$/);
    await expect(page.getByText(/Create Account/i).first()).toBeVisible();
  });

  test("Join → Login link", async ({ page }) => {
    await page.goto("/join");
    await page.locator('a[href="/login"]').first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  });

  test("Login → Join link", async ({ page }) => {
    await page.goto("/login");
    await page.locator('a[href="/join"]').first().click();
    await expect(page).toHaveURL(/\/join$/);
  });

  test("Login submit button validates (blocks empty)", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/login$/); // no navigation
    await expect(page.getByText(/required|valid/i).first()).toBeVisible();
  });

  test("Register submit button validates (blocks empty)", async ({ page }) => {
    await page.goto("/join");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/join$/); // no navigation
    await expect(page.getByText(/required|select|enter/i).first()).toBeVisible();
  });
});
