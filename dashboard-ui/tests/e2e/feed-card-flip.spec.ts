import { signInDemoReader } from "../mock/auth-mocks";
import { expect, test } from "@playwright/test";
import { catalog } from "../../src/app/mocks/home-mocks";
import { mockCoverSvg } from "../mock/network-mocks";

test.beforeEach(async ({ page }) => {
  await page.route("https://placehold.co/**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: mockCoverSvg }),
  );
});
for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`panel cards flip while controls remain pinned at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/login?next=%2Fhome");
    await signInDemoReader(page);
    await expect(page).toHaveURL(/\/home$/);
    const feed = page.getByLabel("Manga recommendations");
    const card = feed
      .locator(":scope > div > div")
      .first()
      .locator(".home-view-card");
    const actions = card.locator(".feed-card-actions");
    await expect(card.locator(".feed-card-back-art")).toHaveAttribute(
      "src",
      catalog[0].back_cover!.image,
    );
    const front = card.locator(".feed-card-front");
    await expect(front).toBeVisible();
    await expect(front.locator("img")).toHaveAttribute(
      "src",
      catalog[0].cover_url!,
    );
    await expect(
      card.getByRole("heading", { name: catalog[0].title, exact: true }),
    ).toHaveCount(0);
    const top = await actions.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    const bookmark = actions.locator(".action-icon");
    const saved = await bookmark.getAttribute("aria-pressed");
    await bookmark.click();
    await expect(bookmark).toHaveAttribute(
      "aria-pressed",
      saved === "true" ? "false" : "true",
    );
    await expect(front).not.toHaveAttribute("inert");
    await expect(card.locator(".feed-card-stats")).toContainText(
      catalog[0].title,
    );
    // The long mock title and multiple authors share one line without crowding the rating.
    const headerFits = await card.locator(".feed-card-stats").evaluate((header) => {
      const title = header.querySelector(".feed-card-title")!;
      const authors = header.querySelector(".feed-card-authors")!;
      const rating = header.querySelector('[aria-label="Community rating"]')!;
      const bounds = header.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      const authorBox = authors.getBoundingClientRect();
      const ratingBox = rating.getBoundingClientRect();
      return header.scrollWidth <= header.clientWidth &&
        Math.abs(titleBox.bottom - authorBox.bottom) < 5 &&
        authorBox.right < ratingBox.left && ratingBox.right <= bounds.right &&
        titleBox.width > 0 && authorBox.width > 0 &&
        getComputedStyle(title).textOverflow === "ellipsis" &&
        getComputedStyle(authors).textOverflow === "ellipsis";
    });
    expect(headerFits).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("front.png") });
    // Native button activation supports keyboard as well as taps/clicks.
    await front.focus();
    await front.press("Enter");
    const back = card.getByRole("button", {
      name: "Show cover for " + catalog[0].title,
    });
    await expect(back).toBeFocused();
    await expect(front).toHaveAttribute("inert", "");
    await expect(
      card.getByRole("heading", { name: catalog[0].title, exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        actions.evaluate(
          (element, expected) =>
            Math.abs(element.getBoundingClientRect().top - expected),
          top,
        ),
      )
      .toBeLessThan(1);
    await expect(actions.locator(".action-primary")).toBeInViewport();
    await expect(bookmark).toBeInViewport();
    await expect
      .poll(() =>
        card
          .locator(".feed-card-rotator")
          .evaluate(
            (element) =>
              new DOMMatrixReadOnly(getComputedStyle(element).transform).m11,
          ),
      )
      .toBe(-1);
    const layout = await card
      .locator(".feed-card-details")
      .evaluate((element) => {
        const hero = element
          .querySelector(".feed-card-back-hero")!
          .getBoundingClientRect();
        const copy = element
          .querySelector(".feed-card-copy")!
          .getBoundingClientRect();
        const content = element.getBoundingClientRect();
        return {
          gap: copy.top - hero.bottom,
          filled: hero.height + copy.height >= content.height - 2,
        };
      });
    expect(Math.abs(layout.gap)).toBeLessThan(2);
    expect(layout.filled).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("back.png") });
    await card.locator(".feed-card-details").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(feed).toHaveJSProperty("scrollTop", 0);
    await expect(actions.locator(".action-primary")).toBeInViewport();
    await actions.locator(".action-primary").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await back.focus();
    await back.press("Space");
    await expect(front).not.toHaveAttribute("inert");
    await expect(front).toBeFocused();
    await expect(
      card.getByRole("heading", { name: catalog[0].title, exact: true }),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        actions.evaluate(
          (element, expected) =>
            Math.abs(element.getBoundingClientRect().top - expected),
          top,
        ),
      )
      .toBeLessThan(1);
  });
}
test("reduced motion removes the flip animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/home");
  const card = page.locator(".home-view-card").first();
  await card.locator(".feed-card-front").click();
  await expect(card.locator(".feed-card-rotator")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(
    card.getByRole("button", { name: /Show cover for/ }),
  ).toBeFocused();
});

test("both the back artwork and synopsis flip the card while the stats strip remains clickable", async ({
  page,
}) => {
  await page.goto("/home");
  const card = page.locator(".home-view-card").first();
  const front = card.locator(".feed-card-front");
  await card.locator(".feed-card-stats").click();
  await expect(front).toHaveAttribute("inert", "");
  await expect
    .poll(() =>
      card
        .locator(".feed-card-rotator")
        .evaluate(
          (element) =>
            new DOMMatrixReadOnly(getComputedStyle(element).transform).m11,
        ),
    )
    .toBe(-1);
  await card.locator(".feed-card-copy p").click();
  await expect(front).not.toHaveAttribute("inert");
  await expect
    .poll(() =>
      card
        .locator(".feed-card-rotator")
        .evaluate(
          (element) =>
            new DOMMatrixReadOnly(getComputedStyle(element).transform).m11,
        ),
    )
    .toBe(1);
  await front.click();
  await expect
    .poll(() =>
      card
        .locator(".feed-card-rotator")
        .evaluate(
          (element) =>
            new DOMMatrixReadOnly(getComputedStyle(element).transform).m11,
        ),
    )
    .toBe(-1);
  await card
    .locator(".feed-card-back-hero")
    .click({ position: { x: 20, y: 70 } });
  await expect(front).not.toHaveAttribute("inert");
  await expect(front).toBeFocused();
});

test("long titles and author credits stay inside the back header on a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/home");
  const feed = page.getByLabel("Manga recommendations");
  await feed.evaluate((element) =>
    element.scrollTo({ top: element.clientHeight, behavior: "instant" }),
  );
  const card = feed
    .locator(":scope > div > div")
    .nth(1)
    .locator(".home-view-card");
  await card.locator(".feed-card-front").click();
  await expect
    .poll(() =>
      card
        .locator(".feed-card-rotator")
        .evaluate(
          (element) =>
            new DOMMatrixReadOnly(getComputedStyle(element).transform).m11,
        ),
    )
    .toBe(-1);
  const fits = await card
    .locator(".feed-card-back-hero")
    .evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return [
        ...element.querySelectorAll("h2,div:last-child > div > span"),
      ].every(
        (child) => child.getBoundingClientRect().bottom <= bounds.bottom - 4,
      );
    });
  expect(fits).toBe(true);
  await expect(
    card.getByRole("heading", { name: catalog[1].title, exact: true }),
  ).toBeVisible();
  await expect(
    card.locator(".feed-card-actions .action-primary"),
  ).toBeInViewport();
});
