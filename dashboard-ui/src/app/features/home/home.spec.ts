import { expect, it } from "vitest";
import { Home } from "./home";
import { renderComponent } from "../../../../tests/render-component";

it("renders recommendations and guest navigation", async () => {
  const { element } = await renderComponent(Home);
  expect(element.querySelector("[data-recommendation-feed]")).toBeTruthy();
  expect(element.querySelector("nav a")?.textContent).toContain("Sign in");
});
it("responds to query parameters by showing the private library gate", async () => {
  const { route, element, stable } = await renderComponent(Home);
  route.setQuery({ tab: "library" });
  await stable();
  expect(element.textContent).toContain("Sign in to see your readings");
  expect(element.querySelector("[data-recommendation-feed]")).toBeNull();
});
