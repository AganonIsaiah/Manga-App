import { TestBed } from "@angular/core/testing";
import { expect, it, vi } from "vitest";
import { throwError } from "rxjs";
import { PanelPicker } from "./panel-picker";
import { HomeApi } from "../../../../../services/home/home.services";
import {
  mockPanelSuggestions,
  mockFavouritePanels,
} from "../../../../../mocks/home-mocks";
import { renderComponent } from "../../../../../../../tests/render-component";

it("loads panel suggestions through the service and disables saved panels", async () => {
  const { element } = await renderComponent(PanelPicker, {
    existingIds: mockFavouritePanels.map((panel) => panel.id),
  });
  expect(element.querySelectorAll(".panel-choice")).toHaveLength(
    mockPanelSuggestions.length,
  );
  expect(element.querySelectorAll(".panel-choice:disabled")).toHaveLength(
    mockFavouritePanels.length,
  );
  expect(
    element.querySelector<HTMLButtonElement>(".panel-picker-add")!.disabled,
  ).toBe(true);
});
it("allows multiple selections, filtering and adding the selected panels", async () => {
  const { fixture, element, stable } = await renderComponent(PanelPicker, {
    existingIds: mockFavouritePanels.map((panel) => panel.id),
  });
  const added = vi.fn();
  fixture.componentInstance.added.subscribe(added);
  const choices = element.querySelectorAll<HTMLButtonElement>(
    ".panel-choice:not(:disabled)",
  );
  choices[0].click();
  choices[1].click();
  await stable();
  expect(element.querySelector('[role="status"]')!.textContent).toContain(
    "2 selected",
  );
  fixture.componentInstance.query.set("no-such-story");
  await stable();
  expect(element.textContent).toContain("No panels match");
  element.querySelector<HTMLButtonElement>(".panel-picker-add")!.click();
  expect(added).toHaveBeenCalledWith(mockPanelSuggestions.slice(3, 5));
});
it("retries a failed panel lookup without discarding selections", async () => {
  const { fixture, element, stable } = await renderComponent(PanelPicker);
  fixture.componentInstance.toggle(mockPanelSuggestions[3].id);
  vi.spyOn(TestBed.inject(HomeApi), "getPanelSuggestions").mockReturnValueOnce(
    throwError(() => new Error("Panels offline")),
  );
  fixture.componentInstance.load();
  await stable();
  expect(element.textContent).toContain("Panels offline");
  element.querySelector<HTMLButtonElement>(".action-secondary")!.click();
  await stable();
  expect(element.querySelectorAll(".panel-choice")).toHaveLength(
    mockPanelSuggestions.length,
  );
  expect(fixture.componentInstance.selected()).toHaveLength(1);
});
