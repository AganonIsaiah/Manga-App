import { signInDemoReader } from "../mock/auth-mocks";
import { expect, test, type Page } from "@playwright/test";
import {
  readers,
  mockFavouritePanels,
  mockPanelSuggestions,
  mockProfileDetails,
} from "../../src/app/mocks/home-mocks";
import { mockCoverSvg } from "../mock/network-mocks";

test.beforeEach(async ({ page }) => {
  await page.route("https://placehold.co/**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: mockCoverSvg }),
  );
});
async function login(page: Page) {
  await page.goto("/login?next=%2Fhome%3Ftab%3Dlibrary");
  await signInDemoReader(page);
  await expect(
    page.getByRole("heading", { name: mockProfileDetails.name, exact: true }),
  ).toBeVisible();
}
for (const width of [320, 390, 768, 1440]) {
  test(`profile collections fit ${width}px with four favourites and three recent reads`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    await expect(page.locator(".favourite-tile")).toHaveCount(4);
    await expect(page.locator(".profile-recent-card")).toHaveCount(3);
    const sections = [
      ".profile-favourites",
      ".profile-recent",
      ".profile-panels",
    ];
    for (const section of sections) {
      await page.locator(section).scrollIntoViewIfNeeded();
      const fits = await page.locator(section).evaluate((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.left >= 0 &&
          box.right <= document.documentElement.clientWidth + 1 &&
          element.scrollWidth <= element.clientWidth + 1
        );
      });
      expect(fits).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(section.slice(1) + ".png"),
      });
    }
    await page.getByRole("button", { name: "Add panels", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add favourite panels" });
    await expect(dialog).toBeVisible();
    const fits = await dialog.evaluate(
      (element) =>
        element.getBoundingClientRect().right <= innerWidth &&
        element.getBoundingClientRect().left >= 0 &&
        element.scrollWidth <= element.clientWidth + 1,
    );
    expect(fits).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("panel-picker.png") });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
}
test("owners can add several panels, remove panels, and keep the changes after reload", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Add panels", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Add favourite panels" });
  await expect(dialog.locator(".panel-choice:disabled")).toHaveCount(
    mockFavouritePanels.length,
  );
  await dialog
    .getByRole("button", {
      name: `Select panel from ${mockPanelSuggestions[3].title}, chapter ${mockPanelSuggestions[3].chapter}`,
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", {
      name: `Select panel from ${mockPanelSuggestions[4].title}, chapter ${mockPanelSuggestions[4].chapter}`,
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", { name: "Add 2 panels", exact: true })
    .click();
  await expect(page.locator(".profile-panel")).toHaveCount(5);
  await page.reload();
  await expect(page.locator(".profile-panel")).toHaveCount(5);
  let first = page.locator(".profile-panel").first();
  await first.hover();
  await first
    .getByRole("button", { name: /Remove favourite panel from/ })
    .click();
  await expect(page.locator(".profile-panel")).toHaveCount(4);
  // Empty is intentional persisted state, not a request to restore the demo defaults.
  for (let remaining = 4; remaining > 0; remaining--) {
    first = page.locator(".profile-panel").first();
    await first.hover();
    await first
      .getByRole("button", { name: /Remove favourite panel from/ })
      .click();
    await expect(page.locator(".profile-panel")).toHaveCount(remaining - 1);
  }
  await expect(page.locator(".profile-panels-empty")).toBeVisible();
  await page.reload();
  await expect(page.locator(".profile-panel")).toHaveCount(0);
  await expect(page.locator(".profile-panels-empty")).toBeVisible();
  await page.getByRole("button", { name: "Add panels", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Add favourite panels" });
  await expect(dialog.locator(".panel-choice:disabled")).toHaveCount(0);
  await dialog
    .getByRole("button", {
      name: `Select panel from ${mockPanelSuggestions[0].title}, chapter ${mockPanelSuggestions[0].chapter}`,
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", { name: "Add 1 panel", exact: true })
    .click();
  await expect(page.locator(".profile-panel")).toHaveCount(1);
});
test("public profiles remain read-only and do not inherit the signed-in readers collection", async ({
  page,
}) => {
  await login(page);
  const ownPanel = page.locator(".profile-panel").first();
  await ownPanel.hover();
  await ownPanel
    .getByRole("button", { name: /Remove favourite panel from/ })
    .click();
  await expect(page.locator(".profile-panel")).toHaveCount(
    mockFavouritePanels.length - 1,
  );
  await page.goto(`/home?tab=library&user=${readers[0].username}`);
  await expect(
    page.getByRole("heading", { name: readers[0].name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add panels", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".profile-panel")).toHaveCount(
    mockFavouritePanels.length,
  );
  await expect(page.locator(".profile-panel-remove")).toHaveCount(0);
  await page.locator(".panel-tile").first().click();
  const preview = page.getByRole("dialog", { name: "Favourite panel" });
  await expect(preview).toBeVisible();
  await expect(
    preview.getByRole("button", { name: "Remove from favourites" }),
  ).toHaveCount(0);
});
test("cancelling the picker leaves the existing collection unchanged", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Add panels", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add favourite panels" });
  await dialog.locator(".panel-choice:not(:disabled)").first().click();
  await dialog.getByRole("button", { name: "Close panel picker" }).click();
  await expect(page.locator(".profile-panel")).toHaveCount(
    mockFavouritePanels.length,
  );
});
