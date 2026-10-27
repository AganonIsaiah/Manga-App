import { expect, test } from "@playwright/test";

test("signup location and avatar replacement persist across a reload", async ({page}) => {
  const username = `photo_${Date.now()}`;
  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Photo Reader");
  await page.getByLabel("Username", {exact: true}).fill(username);
  await page.getByLabel("Email address").fill(`${username}@example.com`);
  await page.getByLabel("Country (optional)").fill("Canad");
  await page.getByRole("option", {name: "Canada", exact: true}).click();
  await page.getByLabel("City (optional)").fill("Toron");
  await page.getByRole("option", {name: "Toronto", exact: true}).click();
  await page.getByLabel("Password", {exact: true}).fill("a-long-photo-password");
  await page.getByRole("button", {name: "Create account", exact: true}).click();
  await expect(page.getByRole("status")).toContainText("Account created");
  await page.goto("/login?next=%2Fhome%3Ftab%3Dlibrary");
  await page.getByLabel("Email or username").fill(username);
  await page.getByLabel("Password", {exact: true}).fill("a-long-photo-password");
  await page.getByRole("button", {name: "Sign in", exact: true}).click();
  await expect(page.locator(".library-shell header")).toContainText("Toronto, Canada");
  await expect(page.locator(".library-shell header")).toContainText(
    `Joined ${new Intl.DateTimeFormat("en", {month: "long", year: "numeric", timeZone: "UTC"}).format(new Date())}`,
  );
  const avatar = page.getByRole("button", {name: "Change profile photo"});
  await expect(avatar).toContainText("P");
  await page.getByLabel("Choose profile photo").setInputFiles({
    name: "photo.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRXsAAAAASUVORK5CYII=", "base64"),
  });
  await expect(page.getByRole("dialog", {name: "Update profile photo"})).toBeVisible();
  await page.getByRole("button", {name: "Save photo", exact: true}).click();
  await expect(page.getByRole("status")).toHaveText("Profile photo updated.");
  const image = page.getByAltText("Your profile photo", {exact: true});
  await expect(image).toBeVisible();
  const firstUrl = await image.getAttribute("src");
  await page.reload();
  await expect(page.getByAltText("Your profile photo", {exact: true})).toHaveAttribute("src", firstUrl!);
  await page.screenshot({path: "/tmp/manga-profile-avatar.png"});
});

test("confirmation without a token shows inbox guidance on a narrow screen", async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/confirm-email");
  await expect(page.getByRole("heading", {name: "Check your inbox"})).toBeVisible();
  await expect(page.getByRole("link", {name: "Continue to sign in"})).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.screenshot({path: "/tmp/manga-confirm-email.png"});
});
