import { expect, it } from "vitest";
import { Profile } from "./profile";
import { renderComponent } from "../../../../../../tests/render-component";
import { mockProfileDetails } from "../../../../mocks/home-mocks";
import { getMockProfileData } from "../../../../mocks/home-mocks";

it("renders favourite manga, recent reads, panels and rating totals", async () => {
  const view = getMockProfileData(mockProfileDetails.username)!;
  const { element } = await renderComponent(Profile, {
    details: view.profile,
    favouritePanels: view.favouritePanels,
    readingMood: view.readingMood,
  });
  expect(element.textContent).toContain("Favourite manga");
  expect(element.textContent).toContain("Recently read");
  expect(element.textContent).toContain("Favourite panels");
  expect(element.textContent).toContain(
    view.profile.ratings.total_ratings + " total",
  );
});
it("opens a favourite panel and closes it", async () => {
  const view = getMockProfileData(mockProfileDetails.username)!;
  const { element, stable } = await renderComponent(Profile, {
    details: view.profile,
    favouritePanels: view.favouritePanels,
    readingMood: view.readingMood,
  });
  element.querySelector<HTMLButtonElement>(".panel-tile")!.click();
  await stable();
  expect(element.querySelector("dialog img")?.getAttribute("src")).toBe(
    view.favouritePanels[0].image,
  );
  element
    .querySelector<HTMLButtonElement>('[aria-label="Close panel"]')!
    .click();
  await stable();
  expect(element.querySelector("dialog")).toBeNull();
});
