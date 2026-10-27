import { expect, it, vi } from "vitest";
import { ServiceNotice } from "./service-notice";
import { renderComponent } from "../../../../tests/render-component";

it("renders the requested loading status", async () => {
  const { element } = await renderComponent(ServiceNotice, {
    label: "Loading stories…",
  });
  expect(element.querySelector('[role="status"]')?.textContent).toContain(
    "Loading stories…",
  );
});
it("displays a service failure and emits a retry request", async () => {
  const { fixture, element } = await renderComponent(ServiceNotice, {
    error: new Error("Offline"),
  });
  const retry = vi.fn();
  fixture.componentInstance.retry.subscribe(retry);
  expect(element.textContent).toContain("Offline");
  element.querySelector("button")!.click();
  expect(retry).toHaveBeenCalledOnce();
});
