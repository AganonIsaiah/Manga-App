import { firstValueFrom } from "rxjs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiConfig } from "../config/api.config";
import {
  catalog,
  readers,
  mockProfileDetails,
  mockInitialLibraryState,
  mockSuggestionPills,
} from "../mocks/home-mocks";
import { TestBed } from "@angular/core/testing";
import { HttpTestingController } from "@angular/common/http/testing";
import { HomeApi } from "./home.services";
import { LibraryState } from "./library-state.services";
import { ApiError } from "../models/api-client.model";
let api: HomeApi;
let http: HttpTestingController;
let library: LibraryState;

beforeEach(() => {
  apiConfig.useMocks = true;
  api = TestBed.inject(HomeApi);
  http = TestBed.inject(HttpTestingController);
  library = TestBed.inject(LibraryState);
});
afterEach(() => {
  apiConfig.useMocks = true;
  apiConfig.baseUrl = "/api";
  http.verify();
});

describe("mock service adapter", () => {
  it("loads all home data through services without making HTTP requests", async () => {
    const data = await firstValueFrom(api.getHomeData());
    expect(data.catalog).toEqual(catalog);
    expect(data.readers).toEqual(readers);
    expect(data.suggestions).toEqual(mockSuggestionPills);
    expect(data.recommendations).toEqual(
      (await firstValueFrom(api.getForYouFeed())).details,
    );
    http.expectNone(() => true);
  });
  it("returns independent copies instead of leaking fixture mutations", async () => {
    const first = await firstValueFrom(api.getMangaCatalog());
    first.details[0].title = "Changed by a caller";
    const second = await firstValueFrom(api.getMangaCatalog());
    expect(second.details[0].title).toBe(catalog[0].title);
    const suggestions = await firstValueFrom(api.getSearchSuggestions());
    suggestions.pop();
    expect(await firstValueFrom(api.getSearchSuggestions())).toEqual(
      mockSuggestionPills,
    );
  });
  it("searches with genre/status filtering and sorting", async () => {
    const result = await firstValueFrom(
      api.getSearchFeed({
        query: "fantasy",
        status: "completed",
        genre: "Fantasy",
      }),
    );
    expect(result.details.length).toBeGreaterThan(0);
    expect(
      result.details.every(
        (manga) =>
          manga.status === "completed" && manga.genres.includes("Fantasy"),
      ),
    ).toBe(true);
    const sorted = (
      await firstValueFrom(
        api.getSearchFeed({ query: "fantasy", sort: "Title A–Z" }),
      )
    ).details.map((manga) => manga.title);
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
    expect(
      (await firstValueFrom(api.getSearchFeed({ query: "not-found-title" })))
        .details,
    ).toEqual([]);
  });
  it("searches names and usernames and respects connection lists", async () => {
    expect(
      await firstValueFrom(
        api.getReaders({ query: `@${readers[0].username}` }),
      ),
    ).toEqual([readers[0]]);
    expect(
      await firstValueFrom(
        api.getReaders({ usernames: [readers[1].username] }),
      ),
    ).toEqual([readers[1]]);
    expect(
      await firstValueFrom(api.getReaders({ query: "no-such-reader" })),
    ).toEqual([]);
  });
  it("loads profile, panels and library state together", async () => {
    const data = await firstValueFrom(
      api.getUserProfile(mockProfileDetails.username),
    );
    expect(data.profile.username).toBe(mockProfileDetails.username);
    expect(data.state).toEqual(mockInitialLibraryState);
    expect(data.favouritePanels.length).toBeGreaterThan(0);
    expect(
      (await firstValueFrom(api.getUserProfile(readers[0].username))).profile
        .name,
    ).toBe(readers[0].name);
    await expect(
      firstValueFrom(api.getUserProfile("missing-reader")),
    ).rejects.toMatchObject({
      status: 404,
    });
  });
  it("persists an account's library and rejects corrupt saved state", async () => {
    const state = structuredClone(mockInitialLibraryState);
    state.bookmarks = [];
    expect(
      await firstValueFrom(
        api.saveUserLibrary(mockProfileDetails.username, state),
      ),
    ).toEqual(state);
    expect(
      (await firstValueFrom(api.getUserProfile(mockProfileDetails.username)))
        .state.bookmarks,
    ).toEqual([]);
    expect(
      (await firstValueFrom(api.getUserProfile(readers[0].username))).state
        .bookmarks,
    ).not.toEqual([]);
    localStorage.setItem(
      library.storageKey(mockProfileDetails.username),
      "invalid json",
    );
    expect(
      (await firstValueFrom(api.getUserProfile(mockProfileDetails.username)))
        .state,
    ).toEqual(mockInitialLibraryState);
  });
});

describe("Angular HTTP adapter integration points", () => {
  it("uses configured endpoint paths, query parameters, and credentials", async () => {
    apiConfig.useMocks = false;
    apiConfig.baseUrl = "https://api.example.test/v1/";
    let result = firstValueFrom(api.getForYouFeed());
    const request = http.expectOne("https://api.example.test/v1/manga/for-you");
    expect(request.request.withCredentials).toBe(true);
    request.flush({ details: [] });
    expect(await result).toEqual({ details: [] });
    result = firstValueFrom(api.getMangaCatalog());
    http.expectOne("https://api.example.test/v1/manga").flush({ details: [] });
    await result;
    const suggestions = firstValueFrom(api.getSearchSuggestions());
    http
      .expectOne("https://api.example.test/v1/manga/search/suggestions")
      .flush([]);
    await suggestions;
    const readersResult = firstValueFrom(
      api.getReaders({
        query: "mira",
        usernames: [readers[0].username],
      }),
    );
    http
      .expectOne(
        `https://api.example.test/v1/users?q=mira&username=${readers[0].username}`,
      )
      .flush([]);
    await readersResult;
    const profile = firstValueFrom(api.getUserProfile("a/b"));
    http.expectOne("https://api.example.test/v1/users/a%2Fb/library").flush({});
    await profile;
  });
  it("sends search filters and serializes library updates with HttpClient", async () => {
    apiConfig.useMocks = false;
    const search = firstValueFrom(
      api.getSearchFeed({
        query: "dark fantasy",
        genre: "Fantasy",
        status: "ongoing",
        sort: "Newest",
      }),
    );
    http
      .expectOne(
        "/api/manga/search?q=dark+fantasy&genre=Fantasy&status=ongoing&sort=Newest",
      )
      .flush({ details: [] });
    await search;
    const plain = firstValueFrom(
      api.getSearchFeed({
        query: "fantasy",
        genre: "All genres",
        status: "All statuses",
      }),
    );
    http.expectOne("/api/manga/search?q=fantasy").flush({ details: [] });
    await plain;
    const save = firstValueFrom(
      api.saveUserLibrary(mockProfileDetails.username, mockInitialLibraryState),
    );
    const request = http.expectOne(
      `/api/users/${mockProfileDetails.username}/library`,
    );
    expect(request.request.method).toBe("PUT");
    expect(request.request.body).toEqual(mockInitialLibraryState);
    expect(request.request.headers.get("Content-Type")).toBe(
      "application/json",
    );
    request.flush(mockInitialLibraryState);
    expect(await save).toEqual(mockInitialLibraryState);
  });
  it("propagates HTTP failures without returning mock data", async () => {
    apiConfig.useMocks = false;
    const result = firstValueFrom(api.getForYouFeed());
    const failure = expect(result).rejects.toBeInstanceOf(ApiError);
    http
      .expectOne("/api/manga/for-you")
      .flush(null, { status: 503, statusText: "Unavailable" });
    await failure;
    const profile = firstValueFrom(
      api.getUserProfile(mockProfileDetails.username),
    );
    const rejected = expect(profile).rejects.toMatchObject({ status: 503 });
    http
      .expectOne(`/api/users/${mockProfileDetails.username}/library`)
      .flush(null, { status: 503, statusText: "Unavailable" });
    await rejected;
  });
});

it("creates independent mock responses for every subscription", async () => {
  const catalog$ = api.getMangaCatalog();
  const first = await firstValueFrom(catalog$);
  first.details[0].title = "Changed";
  expect((await firstValueFrom(catalog$)).details[0].title).toBe(
    catalog[0].title,
  );
});
it("does not persist mock library changes before subscription", async () => {
  const state = structuredClone(mockInitialLibraryState);
  state.bookmarks = [];
  const key = library.storageKey(mockProfileDetails.username);
  const save$ = api.saveUserLibrary(mockProfileDetails.username, state);
  expect(localStorage.getItem(key)).toBeNull();
  await firstValueFrom(save$);
  expect(JSON.parse(localStorage.getItem(key)!).bookmarks).toEqual([]);
});
