import { renderService as render } from "../../../../../tests/render-service";
import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import ForYouFeed from "./ForYouFeed";
import { HomeProvider } from "../../home.context";
import { catalog } from "../../home.api-mocks";

it("shows recommendation metadata, genre and reading controls", async () => {
  await render(
    <HomeProvider>
      <ForYouFeed />
    </HomeProvider>,
  );
  expect(screen.getByLabelText("Manga recommendations")).toBeInTheDocument();
  expect(screen.getAllByText(catalog[0].title).length).toBeGreaterThan(0);
  expect(
    screen.getByText(`Story: ${catalog[0].authors.join(", ")}`),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Next recommendation" }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: "Start reading" }).length,
  ).toBeGreaterThan(0);
});
it("moves forwards/backwards and loads more recommendations near the bottom", async () => {
  const scroll = vi.spyOn(HTMLElement.prototype, "scrollTo");
  await render(
    <HomeProvider>
      <ForYouFeed />
    </HomeProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Next recommendation" }));
  expect(scroll).toHaveBeenLastCalledWith({ top: 640, behavior: "smooth" });
  fireEvent.click(
    screen.getByRole("button", { name: "Previous recommendation" }),
  );
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: "smooth" });
  const feed = screen.getByLabelText("Manga recommendations");
  Object.defineProperty(feed, "scrollTop", {
    configurable: true,
    value: 640 * 7,
  });
  fireEvent.scroll(feed);
  expect(scroll).toHaveBeenCalledTimes(2);
  expect(
    screen.getAllByRole("button", { name: "Start reading" }).length,
  ).toBeGreaterThan(0);
});

it("re-aligns an arrow destination after the viewport changes during scrolling", async () => {
  const scroll = vi.spyOn(HTMLElement.prototype, "scrollTo");
  await render(
    <HomeProvider>
      <ForYouFeed />
    </HomeProvider>,
  );
  const feed = screen.getByLabelText("Manga recommendations");
  fireEvent.click(screen.getByRole("button", { name: "Next recommendation" }));
  Object.defineProperties(feed, {
    clientHeight: { configurable: true, value: 704 },
    scrollTop: { configurable: true, value: 640 },
  });
  fireEvent(feed, new Event("scrollend"));
  expect(scroll).toHaveBeenLastCalledWith({ top: 704, behavior: "instant" });
});

it("keeps rapid arrow presses in order and respects reduced motion", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
  const scroll = vi.spyOn(HTMLElement.prototype, "scrollTo");
  await render(
    <HomeProvider>
      <ForYouFeed />
    </HomeProvider>,
  );
  const next = screen.getByRole("button", { name: "Next recommendation" });
  fireEvent.click(next);
  fireEvent.click(next);
  fireEvent.click(next);
  expect(scroll).toHaveBeenLastCalledWith({
    top: 640 * 3,
    behavior: "instant",
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Previous recommendation" }),
  );
  expect(scroll).toHaveBeenLastCalledWith({
    top: 640 * 2,
    behavior: "instant",
  });
});
