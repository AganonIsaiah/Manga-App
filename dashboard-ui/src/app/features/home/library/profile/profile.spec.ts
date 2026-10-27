import { expect, it, vi } from "vitest";
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

it("limits the favourite shelf to four and recent history to three", async () => {
  const view = getMockProfileData(mockProfileDetails.username)!;
  const { element } = await renderComponent(Profile, {
    details: view.profile,
    favouritePanels: view.favouritePanels,
    readingMood: view.readingMood,
  });
  expect(element.querySelectorAll(".favourite-tile")).toHaveLength(4);
  expect(element.querySelectorAll(".profile-recent-card")).toHaveLength(3);
  expect(
    element.querySelector('[aria-label^="Remove favourite panel"]'),
  ).toBeNull();
  expect(element.querySelector(".profile-add-panels")).toBeNull();
});
it("lets the owner add and remove panels without nesting view and remove buttons", async () => {
  const view = getMockProfileData(mockProfileDetails.username)!;
  const { fixture, element, stable } = await renderComponent(Profile, {
    details: view.profile,
    favouritePanels: view.favouritePanels,
    readingMood: view.readingMood,
    editable: true,
  });
  const removed = vi.fn();
  const added = vi.fn();
  fixture.componentInstance.panelRemoved.subscribe(removed);
  fixture.componentInstance.panelsAdded.subscribe(added);
  element.querySelector<HTMLButtonElement>(".profile-panel-remove")!.click();
  expect(removed).toHaveBeenCalledWith(view.favouritePanels[0].id);
  expect(fixture.componentInstance.panel()).toBeNull();
  element.querySelector<HTMLButtonElement>(".profile-add-panels")!.click();
  await stable();
  expect(element.querySelector("dialog")?.getAttribute("aria-label")).toBe(
    "Add favourite panels",
  );
  element
    .querySelector<HTMLButtonElement>(".panel-choice:not(:disabled)")!
    .click();
  await stable();
  element.querySelector<HTMLButtonElement>(".panel-picker-add")!.click();
  await stable();
  expect(added).toHaveBeenCalledOnce();
  expect(element.querySelector("dialog")).toBeNull();
});
