import type { Page } from "@playwright/test";
import { mockLoginCredentials } from "../../src/app/mocks/auth-mocks";

export async function signInDemoReader(page: Page) {
  await page
    .getByLabel("Email or username")
    .fill(mockLoginCredentials.identifier);
  await page
    .getByLabel("Password", { exact: true })
    .fill(mockLoginCredentials.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
