import { describe, expect, it } from "vitest";
import {
  catalog,
  readers,
  mockInitialLibraryState,
  mockProfileDetails,
} from "../mocks/home-mocks";
import { TestBed } from "@angular/core/testing";
import { beforeEach } from "vitest";
import { LibraryState } from "./library-state.services";
let library: LibraryState;
beforeEach(() => {
  library = TestBed.inject(LibraryState);
});

describe("persisted library state", () => {
  it("starts guests with empty independent shelves", () => {
    const first = library.state();
    first.bookmarks.push(catalog[0].id);
    library.initialize(null, catalog);
    expect(library.state()).toEqual({
      bookmarks: [],
      progress: {},
      following: [],
      reviews: [],
    });
  });
  it("round trips valid demo state", () => {
    expect(
      library.parseLibraryState(
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
    expect(library.parseLibraryState(raw, catalog, readers)).toBeNull();
  });
  it("scopes saved state to the account", () => {
    expect(library.storageKey("first")).not.toEqual(
      library.storageKey("second"),
    );
  });
  it("reads chapter limits and handles unknown titles", () => {
    expect(library.latestChapter(catalog[0].id, catalog)).toBe(
      Number(catalog[0].recent_chapter.replace(/\D/g, "")),
    );
    expect(library.latestChapter("unknown", catalog)).toBe(1);
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
  const state = {
    ...library.state(),
    progress: { [manga.id]: 12 },
  };
  library.initialize(
    { profile, state, favouritePanels: [], readingMood: "", avatarColor: "" },
    catalog,
  );
  expect(
    Object.values(library.profile()!.recently_read)[0].days_last_read,
  ).toBe(7);
  library.read(manga.id, 13);
  expect(
    Object.values(library.profile()!.recently_read)[0].days_last_read,
  ).toBe(0);
});

it("exposes readonly library signals and recomputes the profile after mutations", () => {
  library.initialize(
    {
      profile: mockProfileDetails,
      state: mockInitialLibraryState,
      favouritePanels: [],
      readingMood: "",
      avatarColor: "",
    },
    catalog,
  );
  expect("set" in library.state).toBe(false);
  const original = structuredClone(mockInitialLibraryState);
  const reader = readers.find(
    (reader) => !library.following().includes(reader.username),
  )!;
  library.toggle("following", reader.username);
  expect(library.profile()?.following).toContain(reader.username);
  const manga = catalog[0];
  library.read(manga.id, 5);
  expect(library.progress()[manga.id]).toBe(5);
  expect(
    Object.values(library.profile()!.recently_read).find(
      (item) => item.title === manga.title,
    )?.current_chapter,
  ).toBe(5);
  expect(mockInitialLibraryState).toEqual(original);
});
it("resets all derived shelves and the profile when the session is cleared", () => {
  library.initialize(
    {
      profile: mockProfileDetails,
      state: mockInitialLibraryState,
      favouritePanels: [],
      readingMood: "",
      avatarColor: "",
    },
    catalog,
  );
  library.initialize(null, catalog);
  expect(library.profile()).toBeNull();
  expect(library.bookmarks()).toEqual([]);
  expect(library.readingIds()).toEqual([]);
  expect(library.following()).toEqual([]);
  expect(library.reviews()).toEqual([]);
});
it("clamps chapters and updates or removes review entries through signal commands", () => {
  library.setCatalog(catalog);
  library.read(catalog[0].id, -2);
  expect(library.progress()[catalog[0].id]).toBe(1);
  library.read(catalog[0].id, 99999);
  expect(library.progress()[catalog[0].id]).toBe(
    library.latestChapter(catalog[0].id),
  );
  const review = {
    id: catalog[0].id,
    rating: 5,
    text: "Original",
    date: "2026-10-27",
  };
  library.saveReview(review);
  library.saveReview({ ...review, text: "Edited" });
  expect(library.reviews()).toEqual([{ ...review, text: "Edited" }]);
  library.deleteReview(review.id);
  expect(library.reviews()).toEqual([]);
});
