import { expect, it } from "vitest";
import { Library } from "./library";
import { renderComponent } from "../../../../../tests/render-component";
import { mockProfileDetails } from "../../../mocks/home-mocks";

it("does not expose the demo profile to a guest", async () => {
  const { element } = await renderComponent(Library);
  expect(element.textContent).toContain("Your library");
  expect(element.textContent).not.toContain(mockProfileDetails.name);
});
it("switches an authenticated library between readings, bookmarks, and review editing", async () => {
  const { fixture, element, stable } = await renderComponent(
    Library,
    {},
    {},
    "div",
    true,
  );
  fixture.componentInstance.changeTab("readings");
  await stable();
  expect(element.querySelector("progress")).toBeTruthy();
  fixture.componentInstance.changeTab("bookmarks");
  await stable();
  expect(element.textContent).toContain("Saved for later");
  fixture.componentInstance.changeTab("reviews");
  fixture.componentInstance.startReview();
  await stable();
  expect(element.querySelector("dialog")?.getAttribute("aria-label")).toBe(
    "Write a review",
  );
  expect(element.querySelector("textarea")).toBeTruthy();
});
