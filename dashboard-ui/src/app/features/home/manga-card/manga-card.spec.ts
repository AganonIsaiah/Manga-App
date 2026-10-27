import { expect, it } from "vitest";
import { MangaCard } from "./manga-card";
import { renderComponent } from "../../../../../tests/render-component";
import { catalog } from "../../../mocks/home-mocks";

it("renders a shelf card with manga details and reading controls", async () => {
  const { element } = await renderComponent(
    MangaCard,
    { manga: catalog[0] },
    {},
    "article",
  );
  expect(element.tagName).toBe("ARTICLE");
  expect(element.querySelector("h3")?.textContent).toBe(catalog[0].title);
  expect(element.querySelector('[aria-label^="Bookmark "]')).toBeTruthy();
});
it("updates the accessible cover when its manga changes", async () => {
  const { fixture, element, stable } = await renderComponent(
    MangaCard,
    {
      manga: catalog[0],
    },
    {},
    "article",
  );
  fixture.componentRef.setInput("manga", catalog[1]);
  await stable();
  expect(
    element.querySelector('[role="img"]')?.getAttribute("aria-label"),
  ).toBe(catalog[1].title + " cover");
});
