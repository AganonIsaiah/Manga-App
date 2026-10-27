import { expect, it } from "vitest";
import { Search } from "./search";
import { renderComponent } from "../../../../../tests/render-component";

it("updates suggestion selection without submitting a search", async () => {
  const { element, fixture, stable } = await renderComponent(Search);
  const pill = element.querySelector<HTMLButtonElement>("ul button")!;
  pill.click();
  await stable();
  expect(pill.getAttribute("aria-pressed")).toBe("true");
  expect(fixture.componentInstance.query()).toBe(pill.textContent?.trim());
  element
    .querySelector<HTMLButtonElement>('[aria-label="Clear search"]')!
    .click();
  await stable();
  expect(fixture.componentInstance.query()).toBe("");
});
it("renders filtered manga results and an empty state for unknown titles", async () => {
  const { element, route, stable } = await renderComponent(
    Search,
    {},
    { q: "fantasy" },
  );
  expect(element.querySelectorAll(".manga-card").length).toBeGreaterThan(0);
  route.setQuery({ q: "no-such-manga-title" });
  await stable();
  expect(element.textContent).toContain("No stories found");
});
