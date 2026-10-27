import { expect, it } from "vitest";
import { App } from "./app";
import { renderComponent } from "../../tests/render-component";

it("renders the Angular router outlet and preserves the root layout", async () => {
  const { element } = await renderComponent(App);
  expect(element.querySelector("router-outlet")).toBeTruthy();
  expect(element.classList.contains("contents")).toBe(true);
});
