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

test("location dropdowns filter, support keyboard selection, and reset city by country", async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/signup");
  const country = page.getByRole("combobox", {name: "Country (optional)"});
  const city = page.getByRole("combobox", {name: "City (optional)"});
  await expect(city).toBeDisabled();
  await country.fill("Canad");
  await expect(page.getByRole("option", {name: "Canada", exact: true})).toBeVisible();
  await country.press("ArrowDown");
  await country.press("Enter");
  await expect(country).toHaveValue("Canada");
  await city.fill("Toron");
  await expect(page.getByRole("option", {name: "Toronto", exact: true})).toBeVisible();
  await page.screenshot({path: "/tmp/manga-location-dropdown.png"});
  await page.getByRole("option", {name: "Toronto", exact: true}).click();
  await country.fill("France");
  await page.getByRole("option", {name: "France", exact: true}).click();
  await expect(city).toHaveValue("");
  await city.fill("My hometown");
  await page.getByRole("option", {name: "Use “My hometown”", exact: true}).click();
  await expect(city).toHaveValue("My hometown");
  await country.click();
  await page.getByRole("option", {name: "Skip for now", exact: true}).click();
  await expect(city).toBeDisabled();
  await expect(city).toHaveValue("");
});
