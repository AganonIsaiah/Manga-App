import { expect, it } from "vitest";
import { FeedCard } from "./feed-card";
import { renderComponent } from "../../../../../../tests/render-component";
import { catalog } from "../../../../mocks/home-mocks";

it("starts on the front-cover face with one persistent action footer", async () => {
  const { element, fixture } = await renderComponent(FeedCard, {
    details: catalog[0],
  });
  expect(fixture.componentInstance.flipped()).toBe(false);
  expect(element.querySelector(".feed-card-hint")?.textContent?.trim()).toBe(
    "View details",
  );
  expect(element.querySelector(".feed-card-return")?.textContent?.trim()).toBe(
    "View cover",
  );
  expect(element.querySelector("img")?.getAttribute("src")).toBe(
    catalog[0].cover_url,
  );
  expect(element.querySelector("img")?.getAttribute("alt")).toBe(
    catalog[0].title + " cover",
  );
  expect(element.querySelector<HTMLElement>(".feed-card-back")!.inert).toBe(
    true,
  );
  expect(element.querySelectorAll(".feed-card-actions")).toHaveLength(1);
  expect(
    element.querySelector(".feed-card-actions .action-primary")?.textContent,
  ).toContain("Start reading");
});
it("flips to the details and returns focus to the visible face", async () => {
  const { element, stable } = await renderComponent(FeedCard, {
    details: catalog[0],
  });
  const front = element.querySelector<HTMLButtonElement>(".feed-card-front")!;
  front.click();
  await stable();
  expect(front.inert).toBe(true);
  expect(element.querySelector<HTMLElement>(".feed-card-back")!.inert).toBe(
    false,
  );
  expect(element.querySelector(".feed-card-details")?.textContent).toContain(
    catalog[0].description,
  );
  expect(element.querySelector(".feed-card-details")?.textContent).toContain(
    catalog[0].authors.join(", "),
  );
  const back = element.querySelector<HTMLButtonElement>(".feed-card-return")!;
  expect(document.activeElement).toBe(back);
  back.click();
  await stable();
  expect(front.inert).toBe(false);
  expect(document.activeElement).toBe(front);
});
it("keeps bookmarks and reading controls independent from flipping", async () => {
  const { element, fixture, store, stable } = await renderComponent(
    FeedCard,
    { details: catalog[0] },
    {},
    "div",
    true,
  );
  const saved = store.state().bookmarks.includes(catalog[0].id);
  const bookmark = element.querySelector<HTMLButtonElement>(
    ".feed-card-actions .action-icon",
  )!;
  bookmark.click();
  await stable();
  expect(store.state().bookmarks.includes(catalog[0].id)).toBe(!saved);
  expect(fixture.componentInstance.flipped()).toBe(false);
  element.querySelector<HTMLButtonElement>(".feed-card-front")!.click();
  await stable();
  expect(element.querySelector(".feed-card-actions .action-icon")).toBe(
    bookmark,
  );
  element
    .querySelector<HTMLButtonElement>(".feed-card-actions .action-primary")!
    .click();
  await stable();
  expect(element.querySelector("dialog")).toBeTruthy();
  expect(fixture.componentInstance.flipped()).toBe(true);
});
it("resets to the front when a different recommendation is supplied", async () => {
  const { fixture, element, stable } = await renderComponent(FeedCard, {
    details: catalog[0],
  });
  element.querySelector<HTMLButtonElement>(".feed-card-front")!.click();
  await stable();
  fixture.componentRef.setInput("details", catalog[1]);
  await stable();
  expect(fixture.componentInstance.flipped()).toBe(false);
  expect(element.querySelector("img")?.getAttribute("src")).toBe(
    catalog[1].cover_url,
  );
  expect(
    element.querySelector(".feed-card-front")?.getAttribute("aria-label"),
  ).toBe("Show details for " + catalog[1].title);
});
it("falls back to the cover when the API does not yet supply a panel", async () => {
  const manga = { ...catalog[0], panel: undefined };
  const { element } = await renderComponent(FeedCard, { details: manga });
  expect(element.querySelector("img")?.getAttribute("src")).toBe(
    manga.cover_url,
  );
  expect(element.querySelector("img")?.getAttribute("alt")).toBe(
    manga.title + " cover",
  );
});

it("shows the title, authors and community rating on the front", async () => {
  const { element } = await renderComponent(FeedCard, { details: catalog[0] });
  const stats = element.querySelector(".feed-card-stats")!;
  expect(stats.textContent).toContain("8.6");
  expect(stats.textContent).toContain("/ 10");
  expect(stats.textContent).toContain(catalog[0].title);
  expect(stats.textContent).toContain(catalog[0].authors.join(", "));
  expect(stats.textContent).not.toContain("followers");
  expect(
    element.querySelector(".feed-card-front")?.getAttribute("aria-description"),
  ).toBe("Community rating 8.6 out of 10.");
  expect(stats.textContent).not.toContain("reading");
});
it("allows the synopsis and other back-face content to flip back", async () => {
  const { element, fixture, stable } = await renderComponent(FeedCard, {
    details: catalog[0],
  });
  element.querySelector<HTMLButtonElement>(".feed-card-front")!.click();
  await stable();
  element.querySelector<HTMLElement>(".feed-card-copy p")!.click();
  await stable();
  expect(fixture.componentInstance.flipped()).toBe(false);
  expect(document.activeElement).toBe(
    element.querySelector(".feed-card-front"),
  );
  element.querySelector<HTMLButtonElement>(".feed-card-front")!.click();
  await stable();
  element.querySelector<HTMLElement>(".feed-card-back-hero")!.click();
  await stable();
  expect(fixture.componentInstance.flipped()).toBe(false);
});
it("keeps the footer independent of back-face click handling", async () => {
  const { element, fixture, stable } = await renderComponent(
    FeedCard,
    { details: catalog[0] },
    {},
    "div",
    true,
  );
  element.querySelector<HTMLButtonElement>(".feed-card-front")!.click();
  await stable();
  element
    .querySelector<HTMLButtonElement>(".feed-card-actions .action-icon")!
    .click();
  await stable();
  expect(fixture.componentInstance.flipped()).toBe(true);
});
it("does not invent unavailable stats and falls back to the average rating", async () => {
  const { element, fixture, stable } = await renderComponent(FeedCard, {
    details: { ...catalog[0], statistics: undefined },
  });
  expect(element.querySelector(".feed-card-stats")!.textContent).toContain(
    "Not rated",
  );
  expect(element.querySelector(".feed-card-stats")!.textContent).not.toContain(
    "followers",
  );
  fixture.componentRef.setInput("details", {
    ...catalog[0],
    statistics: { rating: { bayesian: null, average: 8.25 }, follows: 0 },
  });
  await stable();
  expect(element.querySelector(".feed-card-stats")!.textContent).toContain(
    "8.3",
  );
});

it("uses separate front and back cover artwork", async () => {
  const { element } = await renderComponent(FeedCard, { details: catalog[0] });
  expect(
    element.querySelector(".feed-card-front img")?.getAttribute("src"),
  ).toBe(catalog[0].cover_url);
  expect(
    element.querySelector(".feed-card-back-art")?.getAttribute("src"),
  ).toBe(catalog[0].back_cover!.image);
  expect(
    element.querySelector(".feed-card-front img")?.getAttribute("src"),
  ).not.toBe(element.querySelector(".feed-card-back-art")?.getAttribute("src"));
});
it("uses available artwork when either cover image is missing", async () => {
  const manga = { ...catalog[0], cover_url: undefined, back_cover: undefined };
  const { element, fixture, stable } = await renderComponent(FeedCard, {
    details: manga,
  });
  expect(
    element.querySelector(".feed-card-front img")?.getAttribute("src"),
  ).toBe(manga.panel!.image);
  expect(
    element.querySelector(".feed-card-front img")?.getAttribute("alt"),
  ).toBe(manga.panel!.description);
  expect(
    element.querySelector(".feed-card-back-art")?.getAttribute("src"),
  ).toBe(manga.panel!.image);
  fixture.componentRef.setInput("details", {
    ...catalog[0],
    back_cover: undefined,
    panel: undefined,
  });
  await stable();
  expect(
    element.querySelector(".feed-card-back-art")?.getAttribute("src"),
  ).toBe(catalog[0].cover_url);
});
