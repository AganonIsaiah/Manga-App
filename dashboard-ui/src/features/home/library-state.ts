import type { MangaDetails } from "./components/for-you/for-you-feed.types";
import type { Reader } from "./home.types";
import type { ProfileDetails } from "./components/library/library.types";
import type { LibraryState } from "./home.types";

export const libraryStorageKey = (username: string) =>
  `manga-library-v2:${username}`;
export function createEmptyLibrary(): LibraryState {
  return { bookmarks: [], progress: {}, following: [], reviews: [] };
}
// Saved state is user-controlled: reject invalid entries before they reach the UI.
export function parseLibraryState(
  raw: string | null,
  catalog: MangaDetails[],
  readers: Reader[],
): LibraryState | null {
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as LibraryState;
    const mangaIds = new Set(catalog.map((m) => m.id));
    const readerIds = new Set(readers.map((r) => r.username));
    if (
      !state ||
      !Array.isArray(state.bookmarks) ||
      !state.bookmarks.every((id) => mangaIds.has(id)) ||
      !Array.isArray(state.following) ||
      !state.following.every((id) => readerIds.has(id)) ||
      !state.progress ||
      typeof state.progress !== "object" ||
      Array.isArray(state.progress) ||
      !Object.entries(state.progress).every(
        ([id, chapter]) =>
          mangaIds.has(id) &&
          Number.isInteger(chapter) &&
          chapter >= 1 &&
          chapter <= latestChapter(id, catalog),
      ) ||
      !Array.isArray(state.reviews) ||
      !state.reviews.every(
        (review) =>
          review &&
          mangaIds.has(review.id) &&
          Number.isInteger(review.rating) &&
          review.rating >= 1 &&
          review.rating <= 5 &&
          typeof review.text === "string" &&
          typeof review.date === "string",
      )
    )
      return null;
    return state;
  } catch {
    return null;
  }
}
export function latestChapter(id: string, catalog: MangaDetails[]) {
  return (
    Number(
      catalog.find((m) => m.id === id)?.recent_chapter.replace(/\D/g, ""),
    ) || 1
  );
}

export function currentProfile(
  profile: ProfileDetails,
  state: LibraryState,
  catalog: MangaDetails[],
): ProfileDetails {
  return {
    ...profile,
    following: state.following,
    recently_read: Object.fromEntries(
      Object.entries(state.progress)
        .slice(-4)
        .reverse()
        .flatMap(([id, chapter]) => {
          const manga = catalog.find((manga) => manga.id === id);
          return manga
            ? [
                [
                  id,
                  {
                    title: manga.title,
                    cover_url: manga.cover_url ?? "",
                    authors: manga.authors,
                    current_chapter: chapter,
                    days_last_read:
                      Object.values(profile.recently_read).find(
                        (previous) =>
                          previous.title === manga.title &&
                          previous.current_chapter === chapter,
                      )?.days_last_read ?? 0,
                  },
                ],
              ]
            : [];
        }),
    ),
  };
}
