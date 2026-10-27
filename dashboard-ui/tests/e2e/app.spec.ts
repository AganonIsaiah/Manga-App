import { signInDemoReader } from "../mock/auth-mocks";
import { expect, test, type Page } from "@playwright/test";
import {
  catalog,
  mockFavouritePanels,
  mockProfileDetails,
  readers,
} from "../../src/app/mocks/home-mocks";

import { mockCoverSvg } from "../mock/network-mocks";

test.beforeEach(async ({ page }) => {
  await page.route("https://placehold.co/**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: mockCoverSvg }),
  );
});

async function demoLogin(page: Page) {
  await page.goto("/login?next=%2Fhome%3Ftab%3Dlibrary");
  await signInDemoReader(page);
  await expect(
    page.getByRole("heading", { name: mockProfileDetails.name }),
  ).toBeVisible();
}
async function expectNoOverflow(page: Page) {
  const overflowing = await page.locator("body").evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    return [
      ...document.querySelectorAll(
        "main, nav, .library-shell, .results-shell, .manga-grid, .manga-card, .auth-form-shell",
      ),
    ]
      .filter((node) => node.getBoundingClientRect().width > 0)
      .some(
        (node) =>
          node.getBoundingClientRect().right > viewport + 1 ||
          node.getBoundingClientRect().left < -1 ||
          node.scrollWidth > node.clientWidth + 1,
      );
  });
  expect(overflowing).toBe(false);
}

test("guests cannot see the default profile; demo login enables it and logout removes it", async ({
  page,
}) => {
  await page.goto("/home?tab=library");
  await expect(
    page.getByRole("heading", { name: "Your library" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: mockProfileDetails.name }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Home navigation" })
    .getByRole("link", { name: "Sign in" })
    .click();
  await expect(page).toHaveURL(/\/login/);
  await signInDemoReader(page);
  await expect(
    page.getByRole("heading", { name: mockProfileDetails.name }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: mockProfileDetails.name }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/home?tab=library");
  await expect(
    page.getByRole("heading", { name: "Your library" }),
  ).toBeVisible();
});

test("guest manga actions return to the requested screen after demo login", async ({
  page,
}) => {
  await page.goto("/home?tab=search&q=fantasy");
  await page
    .getByRole("button", { name: `Bookmark ${catalog[2].title}`, exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await signInDemoReader(page);
  await expect(page).toHaveURL(/tab=search&q=fantasy/);
  await expect(
    page.getByRole("heading", { name: "Search results" }),
  ).toBeVisible();
});

test("search supports titles, filters, reader discovery and public profiles", async ({
  page,
}) => {
  await page.goto("/home?tab=search");
  await page
    .getByRole("textbox", { name: "Search manga or readers" })
    .fill("fantasy");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: catalog[2].title, exact: true }),
  ).toBeVisible();
  await page.getByLabel("Filter by status").selectOption("completed");
  await expect(
    page.getByRole("heading", { name: catalog[2].title, exact: true }),
  ).toBeVisible();
  await page.getByLabel("Filter by genre").selectOption("Comedy");
  await expect(
    page.getByRole("heading", { name: "No stories found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page
    .getByRole("textbox", { name: "Search manga or readers" })
    .fill(`@${readers[1].username}`);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("link", { name: new RegExp(readers[1].name) }).click();
  await expect(
    page.getByRole("heading", { name: readers[1].name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: mockProfileDetails.name }),
  ).toHaveCount(0);
});

test("demo readers can use every library tab, edit reviews, follow, and inspect panels", async ({
  page,
}) => {
  await demoLogin(page);
  await page
    .getByRole("button", {
      name: `View favourite panel from ${mockFavouritePanels[0].title}`,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Favourite panel" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /Followers/ }).click();
  await expect(page.getByRole("dialog", { name: "followers" })).toBeVisible();
  await page.getByRole("button", { name: "Close connections" }).click();
  await page.getByRole("button", { name: /^Readings/ }).click();
  const progress = page.getByRole("progressbar").first();
  await expect(progress).toHaveCSS("appearance", "none");
  await expect(progress).toHaveCSS("background-color", "rgb(38, 50, 68)");
  await expect(progress).toHaveCSS("color", "rgb(251, 173, 105)");

  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByRole("button", { name: /^Bookmarks/ }).click();
  await expect(
    page.getByRole("heading", { name: "Saved for later" }),
  ).toBeVisible();
  const bookmarked = await page.getByRole("article").count();
  await page
    .getByRole("button", { name: /Remove bookmark for/ })
    .first()
    .click();
  await expect(page.getByRole("article")).toHaveCount(bookmarked - 1);
  await page.getByRole("button", { name: /^Reviews/ }).click();
  await page.getByRole("button", { name: "Write a review" }).click();
  await page
    .getByRole("textbox", { name: "Review text" })
    .fill("A story I would recommend.");
  await page.getByRole("button", { name: "Save review" }).click();
  const review = page
    .getByRole("article")
    .filter({ hasText: "A story I would recommend." });
  await expect(review).toBeVisible();
  await review.getByRole("button", { name: "Delete" }).click();
  await expect(review).toHaveCount(0);
});

for (const width of [320, 390, 600, 768, 1440]) {
  test(`layouts fit ${width}px and manga lists use the expected number of columns`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/login");
    await expectNoOverflow(page);
    await page.goto("/home");
    await expect(page.getByLabel("Manga recommendations")).toBeVisible();
    await expectNoOverflow(page);
    await page.goto("/home?tab=search&q=fantasy");
    await expect(page.locator(".manga-grid")).toBeVisible();
    const columns = width <= 600 ? 1 : width <= 800 ? 2 : 3;
    await expect(page.locator(".manga-grid")).toHaveCSS(
      "grid-template-columns",
      new RegExp(`^(?:[\\d.]+px\\s*){${columns}}$`),
    );
    await expectNoOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("search.png") });
    await demoLogin(page);
    await expectNoOverflow(page);
    for (const tab of ["Readings", "Bookmarks", "Reviews"]) {
      await page.getByRole("button", { name: new RegExp(`^${tab}`) }).click();
      if (tab !== "Reviews")
        await expect(page.locator(".manga-grid")).toHaveCSS(
          "grid-template-columns",
          new RegExp(`^(?:[\\d.]+px\\s*){${columns}}$`),
        );
      await expectNoOverflow(page);
      if (tab === "Readings") {
        const progressBelowCard = await page
          .locator(".manga-grid > div")
          .first()
          .evaluate(
            (wrapper) =>
              wrapper.querySelector(".progress-block")!.getBoundingClientRect()
                .top >=
              wrapper.querySelector(".manga-card")!.getBoundingClientRect()
                .bottom -
                1,
          );
        expect(progressBelowCard).toBe(true);
        await page.screenshot({ path: testInfo.outputPath("readings.png") });
      }
    }
  });
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`short viewport ${viewport.width}x${viewport.height} keeps controls reachable`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/login");
    await page
      .getByRole("button", { name: "Sign in", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeInViewport();
    await page.goto("/home");
    await expect(
      page.getByRole("button", { name: "Start reading" }).first(),
    ).toBeInViewport();
    await expectNoOverflow(page);
    await page.goto("/home?tab=search");
    await page
      .getByRole("heading", { name: "What Do You Want to Read?" })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("heading", { name: "What Do You Want to Read?" }),
    ).toBeInViewport();
    await expectNoOverflow(page);
  });
}

test("navigation remains visible when search and library content scrolls in either direction", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home?tab=search&q=fantasy");
  await expect(page.locator(".manga-grid")).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Home navigation" });
  const originalTop = (await nav.boundingBox())!.y;
  async function checkScrolled(selector: string) {
    await page.locator(selector).evaluate((element) => {
      let scroller: HTMLElement | null = element as HTMLElement;
      while (scroller && getComputedStyle(scroller).overflowY !== "auto")
        scroller = scroller.parentElement;
      if (!scroller) throw new Error("No content scroller found");
      scroller.scrollTop = scroller.scrollHeight;
    });
    await expect(nav).toBeInViewport();
    await expect(nav.locator("..")).toHaveCSS("opacity", "1");
    expect((await nav.boundingBox())!.y).toBe(originalTop);
    await page.locator(selector).evaluate((element) => {
      let scroller: HTMLElement | null = element as HTMLElement;
      while (scroller && getComputedStyle(scroller).overflowY !== "auto")
        scroller = scroller.parentElement;
      scroller!.scrollTop = 0;
    });
    await expect(nav).toBeInViewport();
    await expect(nav.locator("..")).toHaveCSS("opacity", "1");
  }
  await checkScrolled(".results-shell");
  await demoLogin(page);
  await page.getByRole("button", { name: /^Readings/ }).click();
  await checkScrolled(".library-shell");
});
