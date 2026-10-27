import { describe, expect, it } from "vitest";
import {
  catalog,
  readers,
  mockInitialLibraryState,
  mockProfileDetails,
} from "./home.api-mocks";
import {
  currentProfile,
  createEmptyLibrary,
  latestChapter,
  libraryStorageKey,
  parseLibraryState,
} from "./library-state";

describe("persisted library state", () => {
  it("starts guests with empty independent shelves", () => {
    const first = createEmptyLibrary();
    first.bookmarks.push(catalog[0].id);
    expect(createEmptyLibrary()).toEqual({
      bookmarks: [],
      progress: {},
      following: [],
      reviews: [],
    });
  });
  it("round trips valid demo state", () => {
    expect(
      parseLibraryState(
        JSON.stringify(mockInitialLibraryState),
        catalog,
        readers,
      ),
    ).toEqual(mockInitialLibraryState);
  });
  it.each([
    null,
    "{",
    "null",
    "[]",
    "{}",
    JSON.stringify({
      ...mockInitialLibraryState,
      bookmarks: ["missing-title"],
    }),
    JSON.stringify({
      ...mockInitialLibraryState,
      following: ["missing-reader"],
    }),
    JSON.stringify({
      ...mockInitialLibraryState,
      progress: { [catalog[0].id]: -1 },
    }),
    JSON.stringify({
      ...mockInitialLibraryState,
      progress: { [catalog[0].id]: 9999 },
    }),
    JSON.stringify({
      ...mockInitialLibraryState,
      reviews: [{ id: catalog[0].id, rating: 10 }],
    }),
  ])("rejects malformed saved data: %s", (raw) => {
    expect(parseLibraryState(raw, catalog, readers)).toBeNull();
  });
  it("scopes saved state to the account", () => {
    expect(libraryStorageKey("first")).not.toEqual(libraryStorageKey("second"));
  });
  it("reads chapter limits and handles unknown titles", () => {
    expect(latestChapter(catalog[0].id, catalog)).toBe(
      Number(catalog[0].recent_chapter.replace(/\D/g, "")),
    );
    expect(latestChapter("unknown", catalog)).toBe(1);
  });
});

it("keeps API reading-history dates when a chapter is unchanged", () => {
  const manga = catalog[0];
  const profile = {
    ...mockProfileDetails,
    recently_read: {
      recent: {
        title: manga.title,
        cover_url: manga.cover_url ?? "",
        authors: manga.authors,
        current_chapter: 12,
        days_last_read: 7,
      },
    },
  };
  const state = { ...createEmptyLibrary(), progress: { [manga.id]: 12 } };
  expect(
    Object.values(currentProfile(profile, state, catalog).recently_read)[0]
      .days_last_read,
  ).toBe(7);
  state.progress[manga.id] = 13;
  expect(
    Object.values(currentProfile(profile, state, catalog).recently_read)[0]
      .days_last_read,
  ).toBe(0);
});
