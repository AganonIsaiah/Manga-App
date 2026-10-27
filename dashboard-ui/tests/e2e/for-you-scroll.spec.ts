import { expect, test, type Locator } from "@playwright/test";
import { mockCoverSvg } from "./network-mocks";

test.use({ hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.route("https://placehold.co/**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: mockCoverSvg }),
  );
});

async function expectCardAligned(feed: Locator, index: number) {
  await expect
    .poll(() =>
      feed.evaluate(
        (element, expectedIndex) =>
          Math.abs(element.scrollTop - expectedIndex * element.clientHeight),
        index,
      ),
    )
    .toBeLessThan(1);
  const card = feed
    .locator(":scope > div > div")
    .nth(index)
    .locator(".home-view-card");
  await expect(card).toBeInViewport();
  // The user's card margins should remain inside the snap viewport, not get clipped.
  await expect
    .poll(() =>
      card.evaluate((element) => {
        const feed = element.closest("[data-recommendation-feed]")!;
        return Math.abs(
          element.getBoundingClientRect().top -
            feed.getBoundingClientRect().top -
            parseFloat(getComputedStyle(element).marginTop),
        );
      }),
    )
    .toBeLessThan(1);
  await expect
    .poll(() =>
      card.evaluate((element) => {
        const feed = element.closest("[data-recommendation-feed]")!;
        return Math.abs(
          feed.getBoundingClientRect().bottom -
            element.getBoundingClientRect().bottom -
            parseFloat(getComputedStyle(element).marginBottom),
        );
      }),
    )
    .toBeLessThan(1);
}

test("navbar stays visible while arrows navigate, including repeated presses and resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 844 });
  await page.goto("/home");
  const feed = page.getByLabel("Manga recommendations");
  const originalPadding = await page
    .locator("body")
    .evaluate((element) => getComputedStyle(element).padding);
  await expectCardAligned(feed, 0);
  await page.getByRole("button", { name: "Next recommendation" }).click();
  await expectCardAligned(feed, 1);
  await expect(
    page.getByRole("navigation", { name: "Home navigation" }),
  ).toBeInViewport();
  await page
    .getByRole("button", { name: "Next recommendation" })
    .click({ clickCount: 2 });
  await expectCardAligned(feed, 3);
  await page.getByRole("button", { name: "Previous recommendation" }).click();
  await expectCardAligned(feed, 2);
  await expect(page.locator("body")).toHaveCSS("padding", originalPadding);
  await page.setViewportSize({ width: 390, height: 720 });
  await expectCardAligned(feed, 2);
  await page.setViewportSize({ width: 1440, height: 844 });
  await page
    .getByRole("button", { name: "Previous recommendation" })
    .click({ clickCount: 2 });
  await expectCardAligned(feed, 0);
});

for (const width of [390, 1440]) {
  test(`wheel scrolling snaps cleanly and nested details do not resize the feed at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/home");
    const feed = page.getByLabel("Manga recommendations");
    const cover = feed.locator(".home-view-card [role=img]").first();
    await cover.hover();
    await page.mouse.wheel(0, 600);
    await expectCardAligned(feed, 1);
    await expect(
      page.getByRole("navigation", { name: "Home navigation" }).locator(".."),
    ).toHaveCSS("opacity", "1");
    const height = await feed.evaluate((element) => element.clientHeight);
    const body = feed
      .locator(":scope > div > div")
      .nth(1)
      .locator(".primary-clr > div")
      .first();
    // Simulate a scroll originating from a synopsis rather than the feed itself.
    await body.evaluate((element) =>
      element.dispatchEvent(new Event("scroll", { bubbles: false })),
    );
    await expect(feed).toHaveJSProperty("clientHeight", height);
    await expectCardAligned(feed, 1);
    await feed
      .locator(":scope > div > div")
      .nth(1)
      .locator("[role=img]")
      .hover();
    await page.mouse.wheel(0, -600);
    await expectCardAligned(feed, 0);
  });
}

test("phone touch swipes snap forwards and backwards", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home");
  const feed = page.getByLabel("Manga recommendations");
  const session = await page.context().newCDPSession(page);
  async function swipe(from: number, to: number) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 195, y: from }],
    });
    for (let step = 1; step <= 8; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 195, y: from + ((to - from) * step) / 8 }],
      });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          ),
      );
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    // Wait for the native snap to settle before
    // starting another gesture; an in-flight gesture is not a new user swipe.
    await feed.evaluate(
      (element) =>
        new Promise<void>((resolve) => {
          let previousTop = -1,
            previousHeight = -1,
            stableFrames = 0;
          function check() {
            const top = element.scrollTop,
              height = element.clientHeight;
            stableFrames =
              top === previousTop && height === previousHeight
                ? stableFrames + 1
                : 0;
            previousTop = top;
            previousHeight = height;
            if (stableFrames >= 10) resolve();
            else requestAnimationFrame(check);
          }
          requestAnimationFrame(check);
        }),
    );
  }
  await expect(feed).toBeVisible();
  const bounds = (await feed.boundingBox())!;
  await swipe(bounds.y + bounds.height - 40, bounds.y + 40);
  await expectCardAligned(feed, 1);
  await expect(
    page.getByRole("navigation", { name: "Home navigation" }).locator(".."),
  ).toHaveCSS("opacity", "1");
  await swipe(bounds.y + 40, bounds.y + bounds.height - 40);
  await expectCardAligned(feed, 0);
  await session.detach();
});
