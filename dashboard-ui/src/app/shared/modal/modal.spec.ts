import { expect, it, vi } from "vitest";
import { Modal } from "./modal";
import { renderComponent } from "../../../../tests/render-component";

it("opens a native dialog with the supplied accessible name", async () => {
  const { element } = await renderComponent(
    Modal,
    { label: "Test dialog" },
    {},
    "dialog",
  );
  expect(element.tagName).toBe("DIALOG");
  expect(element.hasAttribute("open")).toBe(true);
  expect(element.getAttribute("aria-label")).toBe("Test dialog");
});
it("emits dismissal and prevents native cancellation so the parent controls removal", async () => {
  const { fixture, element } = await renderComponent(
    Modal,
    {
      label: "Test dialog",
    },
    {},
    "dialog",
  );
  const dismiss = vi.fn();
  fixture.componentInstance.dismissed.subscribe(dismiss);
  const cancel = new Event("cancel", { cancelable: true });
  element.dispatchEvent(cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(dismiss).toHaveBeenCalledOnce();
});
