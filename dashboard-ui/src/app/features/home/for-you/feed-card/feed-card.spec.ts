import { expect, it } from "vitest";
import { FeedCard } from "./feed-card";
import { renderComponent } from "../../../../../../tests/render-component";
import { catalog } from "../../../../mocks/home-mocks";

it("renders the selected manga metadata and accessible cover", async () => {
  const { element } = await renderComponent(FeedCard, { details: catalog[0] });
  expect(element.textContent).toContain(catalog[0].title);
  expect(element.textContent).toContain(catalog[0].authors.join(", "));
  expect(
    element.querySelector('[role="img"]')?.getAttribute("aria-label"),
  ).toBe(catalog[0].title + " cover");
});
it("updates the card when a different recommendation is supplied", async () => {
  const { fixture, element, stable } = await renderComponent(FeedCard, {
    details: catalog[0],
  });
  fixture.componentRef.setInput("details", catalog[1]);
  await stable();
  expect(element.textContent).toContain(catalog[1].title);
  expect(
    element.querySelector('[role="img"]')?.getAttribute("aria-label"),
  ).toBe(catalog[1].title + " cover");
});
