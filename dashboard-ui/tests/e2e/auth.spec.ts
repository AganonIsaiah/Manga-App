import { expect, test } from "@playwright/test";
import { mockSignupCredentials } from "../../src/app/mocks/auth-mocks";

test("real registration, cookie login, refresh, reload and server logout work without auth storage", async ({
  page,
  context,
}) => {
  await page.goto("/signup?next=%2Fhome%3Ftab%3Dlibrary");
  await page.getByLabel("Display name").fill(mockSignupCredentials.name);
  await page.getByLabel("Username", { exact: true }).fill("cookie_reader");
  await page.getByLabel("Email address").fill("cookie-reader@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill(mockSignupCredentials.password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Account created");
  await page.getByRole("link", { name: "Continue to sign in" }).click();
  await page.getByLabel("Email or username").fill("COOKIE_READER");
  await page
    .getByLabel("Password", { exact: true })
    .fill(mockSignupCredentials.password);
  await page.getByLabel("Remember me").check();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: mockSignupCredentials.name,
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".favourite-tile")).toHaveCount(0);
  const cookies = (await context.cookies()).filter((cookie) =>
    cookie.name.startsWith("manga_"),
  );
  expect(cookies).toHaveLength(3);
  expect(cookies.every((cookie) => cookie.httpOnly && cookie.expires > 0)).toBe(
    true,
  );
  const stored = await page.evaluate(() => ({
    cookie: document.cookie,
    local: localStorage.getItem("manga-session-v1"),
    session: sessionStorage.getItem("manga-session-v1"),
  }));
  expect(stored.cookie).not.toContain("manga_access");
  expect(stored.cookie).not.toContain("manga_refresh");
  expect(stored.local).toBeNull();
  expect(stored.session).toBeNull();
  const oldRefresh = cookies.find(
    (cookie) => cookie.name === "manga_refresh",
  )!.value;
  await context.clearCookies({ name: "manga_access" });
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: mockSignupCredentials.name,
      exact: true,
    }),
  ).toBeVisible();
  expect(
    (await context.cookies()).find((cookie) => cookie.name === "manga_refresh")!
      .value,
  ).not.toBe(oldRefresh);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(
    (await context.cookies()).filter((cookie) =>
      cookie.name.startsWith("manga_"),
    ),
  ).toHaveLength(0);
  await page.goto("/home?tab=library");
  await expect(
    page.getByRole("heading", { name: "Your library", exact: true }),
  ).toBeVisible();
});
