import { TestBed } from "@angular/core/testing";
import { HomeApi } from "../../../services/home.services";
import { pendingRequest } from "../../../../../tests/mock/request-mocks";
import { expect, it, vi } from "vitest";
import { People } from "./people";
import { renderComponent } from "../../../../../tests/render-component";
import { readers } from "../../../mocks/home-mocks";

it("finds a reader and links to their public profile", async () => {
  const { element } = await renderComponent(People, {
    query: "@" + readers[0].username,
  });
  expect(element.textContent).toContain(readers[0].name);
  expect(element.querySelector("a")?.getAttribute("href")).toContain(
    readers[0].username,
  );
});
it("shows an empty state when no readers match", async () => {
  const { element } = await renderComponent(People, {
    query: "no-such-reader",
  });
  expect(element.textContent).toContain("No readers found");
  expect(element.querySelector(".person-card")).toBeNull();
});

it("unsubscribes a pending reader request when destroyed", async () => {
  const { fixture, stable } = await renderComponent(People);
  const pending = pendingRequest<typeof readers>();
  vi.spyOn(TestBed.inject(HomeApi), "getReaders").mockReturnValue(
    pending.stream,
  );
  fixture.componentRef.setInput("query", "pending-reader");
  await stable();
  expect(pending.observed()).toBe(true);
  fixture.destroy();
  expect(pending.observed()).toBe(false);
});
