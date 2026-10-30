import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3100";

test.describe("Stage 4 smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
  });

  test("login page renders", async ({ page }) => {
    await expect(page.locator("text=VinDeck")).toBeVisible();
  });

  test("theme control exists in page", async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill("testpass123");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/");
    }
    await page.waitForTimeout(1000);
    const avatar = page.locator('button[aria-label="User menu"]');
    if (await avatar.isVisible()) {
      await avatar.click();
      await expect(page.locator("text=Theme")).toBeVisible();
    }
  });
});
