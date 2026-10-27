import { expect, test } from "@playwright/test";
import { mockSignupCredentials } from "../../src/app/mocks/auth-mocks";
for (const width of [320, 1440]) {
  test(`signup and login navigation work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login?next=%2Fhome%3Ftab%3Dlibrary");
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/signup/);
    await page.getByLabel("Display name").fill(mockSignupCredentials.name);
    await page.getByLabel("Username", { exact: true }).fill(mockSignupCredentials.username + width);
    await page.getByLabel("Email address").fill(`signup${width}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill(mockSignupCredentials.password);
    expect(await page.locator("main").evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Account created");
    await page.getByRole("link", { name: "Continue to sign in" }).click();
    await expect(page).toHaveURL(/login\?next=%2Fhome%3Ftab%3Dlibrary/);
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });
}
