import { expect, it, vi } from "vitest";
import { ForYou } from "./for-you";
import { renderComponent } from "../../../../../tests/render-component";

it("renders recommendation frames and advances the arrow destination", async () => {
  const { element, stable } = await renderComponent(ForYou);
  const scroll = vi.spyOn(HTMLElement.prototype, "scrollTo");
  element
    .querySelector<HTMLButtonElement>('[aria-label="Next recommendation"]')!
    .click();
  await stable();
  expect(scroll).toHaveBeenLastCalledWith({ top: 640, behavior: "smooth" });
  element
    .querySelector<HTMLButtonElement>('[aria-label="Previous recommendation"]')!
    .click();
  await stable();
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: "smooth" });
});
it("disconnects its resize observer when destroyed", async () => {
  const { fixture } = await renderComponent(ForYou);
  const disconnect = vi.spyOn(ResizeObserver.prototype, "disconnect");
  fixture.destroy();
  expect(disconnect).toHaveBeenCalledOnce();
});
