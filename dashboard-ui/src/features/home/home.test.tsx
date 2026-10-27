import * as homeServices from "./home.service";
import { renderService as render } from "../../../tests/render-service";
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import HomePage, { InputSearchBar } from "./home.page";
import { HomeProvider } from "./home.context";
import Library from "./components/library/Library";
import MangaCard from "./components/MangaCard";
import People from "./components/People";
import { Search } from "./components/search/Search";
import View2 from "./components/search/View2";
import {
  catalog,
  mockFavouritePanels,
  mockInitialLibraryState,
  mockProfileDetails,
  readers,
} from "./home.api-mocks";
import { signInToDemo, signOut } from "../auth/auth.service";
import { authConfig } from "../auth/auth.config";
import { navigation } from "../../../tests/navigation-mocks";
import { vi } from "vitest";

beforeEach(() => {
  authConfig.useMocks = true;
  signOut();
});
async function login() {
  await act(async () => {
    await signInToDemo();
  });
}
async function library() {
  navigation.params = new URLSearchParams("tab=library");
  return await render(
    <HomeProvider>
      <Library />
    </HomeProvider>,
  );
}

describe("home navigation and guest access", () => {
  it("shows discovery and a sign-in navigation entry, with no personal profile", async () => {
    await render(<HomePage />);
    expect(screen.getByLabelText("Manga recommendations")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fhome%3Ftab%3Dlibrary",
    );
    expect(
      screen.queryByRole("link", { name: "Library" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(mockProfileDetails.name)).not.toBeInTheDocument();
  });
  it("does not reveal a profile on direct guest library visits", async () => {
    await library();
    expect(
      screen.getByRole("heading", { name: "Your library" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`@${mockProfileDetails.username}`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Library sections" }),
    ).not.toBeInTheDocument();
  });
  it("shows the library only after demo login and hides it again on logout", async () => {
    navigation.params = new URLSearchParams("tab=library");
    await render(<HomePage />);
    await login();
    expect(
      await screen.findByRole("heading", { name: mockProfileDetails.name }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(
      await screen.findByRole("heading", { name: "Your library" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`@${mockProfileDetails.username}`),
    ).not.toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith("/login");
  });
  it("does not treat an unknown user URL as the current profile", async () => {
    navigation.params = new URLSearchParams("tab=library&user=unknown-reader");
    await render(
      <HomeProvider>
        <Library />
      </HomeProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Reader not found" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`@${mockProfileDetails.username}`),
    ).not.toBeInTheDocument();
  });
  it("preserves Search and For you navigation without a public profile parameter", async () => {
    navigation.params = new URLSearchParams(
      `tab=library&user=${readers[0].username}`,
    );
    await render(<HomePage />);
    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute(
      "href",
      "/home?tab=search",
    );
    expect(screen.getByRole("link", { name: "For you" })).toHaveAttribute(
      "href",
      "/home?tab=discovery",
    );
  });
});

describe("search", () => {
  it("disables blank input and submits a query", async () => {
    const submit = vi.fn();
    const change = vi.fn();
    const { rerender } = await render(
      <InputSearchBar query="" onQueryChange={change} onSubmit={submit} />,
    );
    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
    await rerender(
      <InputSearchBar
        query="fantasy"
        onQueryChange={change}
        onSubmit={submit}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(submit).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "romance" },
    });
    expect(change).toHaveBeenCalledWith("romance");
  });
  it("adds/removes suggestion pills and clears all", async () => {
    const change = vi.fn();
    const props = {
      searchBar: null,
      submittedQuery: "",
      query: "",
      onQueryChange: change,
      onClear: vi.fn(),
    };
    const { rerender } = await render(
      <HomeProvider>
        <Search {...props} />
      </HomeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Dark fantasy" }));
    expect(change).toHaveBeenLastCalledWith("Dark fantasy");
    await rerender(
      <HomeProvider>
        <Search {...props} query="Dark fantasy" />
      </HomeProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Dark fantasy" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Dark fantasy" }));
    expect(change).toHaveBeenLastCalledWith("");
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(change).toHaveBeenLastCalledWith("");
  });
  it("navigates submitted and cleared searches through the URL", async () => {
    navigation.params = new URLSearchParams("tab=search");
    const view = await render(<HomePage />);
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search manga or readers" }),
      " fantasy ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(navigation.push).toHaveBeenCalledWith("/home?tab=search&q=fantasy", {
      scroll: false,
    });
    navigation.params = new URLSearchParams("tab=search&q=fantasy");
    await view.rerender(<HomePage />);
    await userEvent.click(screen.getByRole("button", { name: "New search" }));
    expect(navigation.push).toHaveBeenLastCalledWith("/home?tab=search", {
      scroll: false,
    });
  });
  it("filters by genre/status, sorts, resets filters, and supports new search", async () => {
    const back = vi.fn();
    await render(
      <HomeProvider>
        <View2 query="fantasy" onBack={back} />
      </HomeProvider>,
    );
    const before = screen.getAllByRole("article").length;
    await userEvent.selectOptions(
      screen.getByLabelText("Filter by status"),
      "completed",
    );
    expect(screen.getAllByRole("article").length).toBeLessThan(before);
    await userEvent.selectOptions(
      screen.getByLabelText("Filter by genre"),
      "Comedy",
    );
    expect(
      screen.getByRole("heading", { name: "No stories found" }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Reset filters" }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(before);
    await userEvent.selectOptions(
      screen.getByLabelText("Sort results"),
      "Title A–Z",
    );
    const titles = screen
      .getAllByRole("article")
      .map((card) => within(card).getByRole("heading").textContent!);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    await userEvent.selectOptions(
      screen.getByLabelText("Sort results"),
      "Newest",
    );
    await userEvent.click(screen.getByRole("button", { name: "New search" }));
    expect(back).toHaveBeenCalledOnce();
  });
  it("searches readers by @username and switches result types", async () => {
    await render(
      <HomeProvider>
        <View2 query={`@${readers[1].username}`} onBack={vi.fn()} />
      </HomeProvider>,
    );
    expect(
      screen.getByRole("link", { name: new RegExp(readers[1].name) }),
    ).toHaveAttribute("href", `/home?tab=library&user=${readers[1].username}`);
    await userEvent.click(screen.getByRole("button", { name: "Manga" }));
    expect(
      screen.getByRole("heading", { name: "No stories found" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Readers" }));
    expect(screen.getByText(`@${readers[1].username}`)).toBeInTheDocument();
  });
  it("shows reader search empty states", async () => {
    await render(
      <HomeProvider>
        <People query="no-such-person" />
      </HomeProvider>,
    );
    expect(screen.getByText(/No readers found/)).toBeInTheDocument();
  });
});

describe("library and shared manga actions", () => {
  it("guest bookmarking, reading and following require login without opening the reader", async () => {
    navigation.params = new URLSearchParams("tab=search&q=fantasy");
    await render(
      <HomeProvider>
        <MangaCard manga={catalog[0]} />
        <People query={readers[0].username} />
      </HomeProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: `Bookmark ${catalog[0].title}` }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Start reading" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Follow" }));
    expect(navigation.push).toHaveBeenCalledTimes(3);
    expect(navigation.push).toHaveBeenLastCalledWith(
      "/login?next=%2Fhome%3Ftab%3Dsearch%26q%3Dfantasy",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });
  it("toggles bookmarks and saves them across remounts", async () => {
    await login();
    const manga = catalog[0];
    const view = await render(
      <HomeProvider>
        <MangaCard manga={manga} />
      </HomeProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: `Bookmark ${manga.title}` }),
    );
    expect(
      screen.getByRole("button", {
        name: `Remove bookmark for ${manga.title}`,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(localStorage.length).toBeGreaterThan(0));
    view.unmount();
    await render(
      <HomeProvider>
        <MangaCard manga={manga} />
      </HomeProvider>,
    );
    expect(
      await screen.findByRole("button", {
        name: `Remove bookmark for ${manga.title}`,
      }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", {
        name: `Remove bookmark for ${manga.title}`,
      }),
    );
    expect(
      screen.getByRole("button", { name: `Bookmark ${manga.title}` }),
    ).toBeInTheDocument();
  });
  it("starts reading and handles chapter boundaries and dialog closing", async () => {
    await login();
    const manga = catalog[3];
    await render(
      <HomeProvider>
        <MangaCard manga={manga} />
      </HomeProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Start reading" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Previous chapter" }),
    ).toBeDisabled();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Next chapter" }),
    );
    expect(
      within(dialog).getByText(/Reading preview · Chapter 2/),
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Previous chapter" }),
    );
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("shows all library tabs, filters readings, edits chapters and filters bookmarks", async () => {
    await login();
    await library();
    await userEvent.click(screen.getByRole("button", { name: /^Readings/ }));
    expect(screen.getAllByRole("article")).toHaveLength(
      Object.keys(mockInitialLibraryState.progress).length,
    );
    await userEvent.click(screen.getByRole("button", { name: "Completed" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Reading" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    const chapter = screen.getByRole("spinbutton", {
      name: `Chapter for ${catalog[0].title}`,
    });
    fireEvent.change(chapter, { target: { value: "999" } });
    expect(
      screen.queryByRole("spinbutton", {
        name: `Chapter for ${catalog[0].title}`,
      }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Bookmarks/ }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search bookmarks" }),
      "not a title",
    );
    expect(
      screen.getByText("No titles match these filters."),
    ).toBeInTheDocument();
  });
  it("creates, edits and deletes a review", async () => {
    await login();
    await library();
    await userEvent.click(screen.getByRole("button", { name: /^Reviews/ }));
    await userEvent.click(
      screen.getByRole("button", { name: "Write a review" }),
    );
    let dialog = screen.getByRole("dialog");
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Review text" }),
      "A memorable read.",
    );
    await userEvent.selectOptions(within(dialog).getByLabelText("Rating"), "3");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Save review" }),
    );
    const article = screen.getByText("A memorable read.").closest("article")!;
    await userEvent.click(
      within(article).getByRole("button", { name: "Edit" }),
    );
    dialog = screen.getByRole("dialog");
    await userEvent.clear(
      within(dialog).getByRole("textbox", { name: "Review text" }),
    );
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Review text" }),
      "Updated review.",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Save review" }),
    );
    await userEvent.click(
      within(screen.getByText("Updated review.").closest("article")!).getByRole(
        "button",
        { name: "Delete" },
      ),
    );
    expect(screen.queryByText("Updated review.")).not.toBeInTheDocument();
  });
  it("opens favourite panels and follower lists", async () => {
    await login();
    await library();
    await userEvent.click(
      screen.getByRole("button", {
        name: `View favourite panel from ${mockFavouritePanels[0].title}`,
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Favourite panel" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close panel" }));
    await userEvent.click(screen.getByRole("button", { name: /Followers/ }));
    expect(
      screen.getByRole("dialog", { name: "followers" }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Close connections" }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Following/ }));
    expect(
      screen.getByRole("dialog", { name: "following" }),
    ).toBeInTheDocument();
  });
  it("public profiles are viewable as guest without revealing the current demo profile", async () => {
    navigation.params = new URLSearchParams(
      `tab=library&user=${readers[0].username}`,
    );
    await render(
      <HomeProvider>
        <Library />
      </HomeProvider>,
    );
    expect(
      screen.getByRole("heading", { name: readers[0].name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: mockProfileDetails.name }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Follow" }));
    expect(navigation.push).toHaveBeenCalled();
  });
  it("following/unfollowing updates the shared state", async () => {
    await login();
    await render(
      <HomeProvider>
        <People query={readers[0].username} />
      </HomeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Following" }));
    expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await userEvent.click(screen.getByRole("button", { name: "Follow" }));
    expect(screen.getByRole("button", { name: "Following" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("service loading and save failures", () => {
  it("shows a load failure and retries through the service", async () => {
    vi.spyOn(homeServices, "getHomeData").mockRejectedValueOnce(
      new Error("Home is unavailable"),
    );
    await render(<HomePage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Home is unavailable");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByLabelText("Manga recommendations"),
    ).toBeInTheDocument();
  });
  it("keeps unsaved changes visible and retries a failed save", async () => {
    await login();
    vi.spyOn(homeServices, "saveUserLibrary").mockRejectedValueOnce(
      new Error("Save is unavailable"),
    );
    await render(
      <HomeProvider>
        <MangaCard manga={catalog[0]} />
      </HomeProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: `Bookmark ${catalog[0].title}` }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Save is unavailable",
    );
    expect(
      screen.getByRole("button", {
        name: `Remove bookmark for ${catalog[0].title}`,
      }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry save" }));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
});
