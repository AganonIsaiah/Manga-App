import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiConfig } from "../../config/api.config";
import {
  catalog,
  readers,
  mockProfileDetails,
  mockInitialLibraryState,
  mockSuggestionPills,
} from "./home.api-mocks";
import {
  getForYouFeed,
  getHomeData,
  getMangaCatalog,
  getReaders,
  getSearchFeed,
  getSearchSuggestions,
  getUserProfile,
  saveUserLibrary,
} from "./home.service";
import { libraryStorageKey } from "./library-state";
import { ApiError } from "../../lib/api-client";

beforeEach(() => {
  apiConfig.useMocks = true;
});
afterEach(() => {
  apiConfig.useMocks = true;
  apiConfig.baseUrl = "/api";
});

describe("mock service adapter", () => {
  it("loads all home data through services without making HTTP requests", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const data = await getHomeData();
    expect(data.catalog).toEqual(catalog);
    expect(data.readers).toEqual(readers);
    expect(data.suggestions).toEqual(mockSuggestionPills);
    expect(data.recommendations).toEqual((await getForYouFeed()).details);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("returns independent copies instead of leaking fixture mutations", async () => {
    const first = await getMangaCatalog();
    first.details[0].title = "Changed by a caller";
    const second = await getMangaCatalog();
    expect(second.details[0].title).toBe(catalog[0].title);
    const suggestions = await getSearchSuggestions();
    suggestions.pop();
    expect(await getSearchSuggestions()).toEqual(mockSuggestionPills);
  });
  it("searches with genre/status filtering and sorting", async () => {
    const result = await getSearchFeed({
      query: "fantasy",
      status: "completed",
      genre: "Fantasy",
    });
    expect(result.details.length).toBeGreaterThan(0);
    expect(
      result.details.every(
        (manga) =>
          manga.status === "completed" && manga.genres.includes("Fantasy"),
      ),
    ).toBe(true);
    const sorted = (
      await getSearchFeed({ query: "fantasy", sort: "Title A–Z" })
    ).details.map((manga) => manga.title);
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
    expect((await getSearchFeed({ query: "not-found-title" })).details).toEqual(
      [],
    );
  });
  it("searches names and usernames and respects connection lists", async () => {
    expect(await getReaders({ query: `@${readers[0].username}` })).toEqual([
      readers[0],
    ]);
    expect(await getReaders({ usernames: [readers[1].username] })).toEqual([
      readers[1],
    ]);
    expect(await getReaders({ query: "no-such-reader" })).toEqual([]);
  });
  it("loads profile, panels and library state together", async () => {
    const data = await getUserProfile(mockProfileDetails.username);
    expect(data.profile.username).toBe(mockProfileDetails.username);
    expect(data.state).toEqual(mockInitialLibraryState);
    expect(data.favouritePanels.length).toBeGreaterThan(0);
    expect((await getUserProfile(readers[0].username)).profile.name).toBe(
      readers[0].name,
    );
    await expect(getUserProfile("missing-reader")).rejects.toMatchObject({
      status: 404,
    });
  });
  it("persists an account's library and rejects corrupt saved state", async () => {
    const state = structuredClone(mockInitialLibraryState);
    state.bookmarks = [];
    expect(await saveUserLibrary(mockProfileDetails.username, state)).toEqual(
      state,
    );
    expect(
      (await getUserProfile(mockProfileDetails.username)).state.bookmarks,
    ).toEqual([]);
    expect(
      (await getUserProfile(readers[0].username)).state.bookmarks,
    ).not.toEqual([]);
    localStorage.setItem(
      libraryStorageKey(mockProfileDetails.username),
      "invalid json",
    );
    expect((await getUserProfile(mockProfileDetails.username)).state).toEqual(
      mockInitialLibraryState,
    );
  });
});

describe("HTTP adapter integration points", () => {
  it("uses configured endpoint paths when mocks are disabled", async () => {
    apiConfig.useMocks = false;
    apiConfig.baseUrl = "https://api.example.test/v1/";
    const fetch = vi
      .fn()
      .mockImplementation(
        async () =>
          new Response(JSON.stringify({ details: [] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetch);
    expect(await getForYouFeed()).toEqual({ details: [] });
    expect(fetch).toHaveBeenLastCalledWith(
      "https://api.example.test/v1/manga/for-you",
      expect.objectContaining({ credentials: "include" }),
    );
    await getMangaCatalog();
    expect(fetch.mock.lastCall![0]).toBe("https://api.example.test/v1/manga");
    await getSearchSuggestions();
    expect(fetch.mock.lastCall![0]).toBe(
      "https://api.example.test/v1/manga/search/suggestions",
    );
    await getReaders({ query: "mira", usernames: [readers[0].username] });
    expect(fetch.mock.lastCall![0]).toBe(
      `https://api.example.test/v1/users?q=mira&username=${readers[0].username}`,
    );
    await getUserProfile("a/b");
    expect(fetch.mock.lastCall![0]).toBe(
      "https://api.example.test/v1/users/a%2Fb/library",
    );
  });
  it("sends search parameters and full library updates through the service", async () => {
    apiConfig.useMocks = false;
    const fetch = vi
      .fn()
      .mockImplementation(
        async () => new Response(JSON.stringify(mockInitialLibraryState)),
      );
    vi.stubGlobal("fetch", fetch);
    await getSearchFeed({
      query: "dark fantasy",
      genre: "Fantasy",
      status: "ongoing",
      sort: "Newest",
    });
    expect(fetch.mock.lastCall![0]).toBe(
      "/api/manga/search?q=dark+fantasy&genre=Fantasy&status=ongoing&sort=Newest",
    );
    await getSearchFeed({
      query: "fantasy",
      genre: "All genres",
      status: "All statuses",
    });
    expect(fetch.mock.lastCall![0]).toBe("/api/manga/search?q=fantasy");
    await saveUserLibrary(mockProfileDetails.username, mockInitialLibraryState);
    expect(fetch).toHaveBeenLastCalledWith(
      `/api/users/${mockProfileDetails.username}/library`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(mockInitialLibraryState),
      }),
    );
    const options = fetch.mock.lastCall![1];
    expect(options.headers.get("Content-Type")).toBe("application/json");
  });
  it("propagates HTTP failures without silently substituting mock data", async () => {
    apiConfig.useMocks = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );
    await expect(getForYouFeed()).rejects.toBeInstanceOf(ApiError);
    await expect(
      getUserProfile(mockProfileDetails.username),
    ).rejects.toMatchObject({ status: 503 });
  });
});
