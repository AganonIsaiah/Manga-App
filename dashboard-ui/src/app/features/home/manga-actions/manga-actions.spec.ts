import { expect, it } from "vitest";
import { MangaActions } from "./manga-actions";
import { renderComponent } from "../../../../../tests/render-component";
import { catalog } from "../../../mocks/home-mocks";

it("toggles bookmark state for an authenticated reader", async () => {
  const { element, store, stable } = await renderComponent(
    MangaActions,
    {
      manga: catalog[0],
    },
    {},
    "div",
    true,
  );
  const saved = store.state().bookmarks.includes(catalog[0].id);
  element.querySelector<HTMLButtonElement>(".action-icon")!.click();
  await stable();
  expect(store.state().bookmarks.includes(catalog[0].id)).toBe(!saved);
  expect(
    element.querySelector(".action-icon")?.getAttribute("aria-pressed"),
  ).toBe(String(!saved));
});
it("opens the reading preview and advances chapter progress", async () => {
  const { element, store, stable } = await renderComponent(
    MangaActions,
    {
      manga: catalog[0],
    },
    {},
    "div",
    true,
  );
  element.querySelector<HTMLButtonElement>(".action-primary")!.click();
  await stable();
  const chapter = store.state().progress[catalog[0].id];
  element.querySelector<HTMLButtonElement>("dialog .action-primary")!.click();
  await stable();
  expect(store.state().progress[catalog[0].id]).toBe(chapter + 1);
  element
    .querySelector<HTMLButtonElement>('[aria-label="Close preview"]')!
    .click();
  await stable();
  expect(element.querySelector("dialog")).toBeNull();
});
