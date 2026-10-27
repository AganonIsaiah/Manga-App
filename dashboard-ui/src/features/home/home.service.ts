import { apiConfig } from "../../config/api.config";
import { requestJson, ApiError } from "../../lib/api-client";
import {
  catalog,
  readers,
  mockForYouFeed,
  mockSuggestionPills,
  getMockProfileData,
  getMockSearchFeed,
  getMockReaders,
} from "./home.api-mocks";
import type {
  HomeData,
  MangaApiResponse,
  SearchRequest,
  ReaderRequest,
  UserProfileData,
} from "./home.api-types";
import type { LibraryState, Reader } from "./home.types";
import { libraryStorageKey, parseLibraryState } from "./library-state";

const copy = <T>(value: T): T => structuredClone(value);
// Endpoint names below are integration points; align them with the backend here.
export async function getMangaCatalog(): Promise<MangaApiResponse> {
  return apiConfig.useMocks
    ? copy({ details: catalog })
    : requestJson("/manga");
}
export async function getForYouFeed(): Promise<MangaApiResponse> {
  return apiConfig.useMocks
    ? copy(mockForYouFeed)
    : requestJson("/manga/for-you");
}
export async function getReaders(
  request: ReaderRequest = {},
): Promise<Reader[]> {
  if (apiConfig.useMocks) return copy(getMockReaders(request));
  const params = new URLSearchParams();
  if (request.query) params.set("q", request.query);
  for (const username of request.usernames ?? [])
    params.append("username", username);
  return requestJson(`/users${params.size ? `?${params}` : ""}`);
}

export async function getSearchSuggestions(): Promise<string[]> {
  return apiConfig.useMocks
    ? copy(mockSuggestionPills)
    : requestJson("/manga/search/suggestions");
}
export async function getHomeData(): Promise<HomeData> {
  const [manga, recommendations, readers, suggestions] = await Promise.all([
    getMangaCatalog(),
    getForYouFeed(),
    getReaders(),
    getSearchSuggestions(),
  ]);
  return {
    catalog: manga.details,
    recommendations: recommendations.details,
    readers,
    suggestions,
  };
}
export async function getSearchFeed(
  request: SearchRequest,
): Promise<MangaApiResponse> {
  if (apiConfig.useMocks) return copy(getMockSearchFeed(request));
  const params = new URLSearchParams({ q: request.query });
  if (request.genre && request.genre !== "All genres")
    params.set("genre", request.genre);
  if (request.status && request.status !== "All statuses")
    params.set("status", request.status);
  if (request.sort) params.set("sort", request.sort);
  return requestJson(`/manga/search?${params}`);
}
export async function getUserProfile(
  username: string,
): Promise<UserProfileData> {
  if (!apiConfig.useMocks)
    return requestJson(`/users/${encodeURIComponent(username)}/library`);
  const profile = getMockProfileData(username);
  if (!profile) throw new ApiError("Reader not found", 404);
  const result = copy(profile);
  // Persistence belongs to the mock adapter, not to components or the live API.
  if (typeof window !== "undefined") {
    try {
      const saved = parseLibraryState(
        localStorage.getItem(libraryStorageKey(username)),
        catalog,
        readers,
      );
      if (saved) result.state = saved;
    } catch {
      /* Continue with the mock response if storage is unavailable. */
    }
  }
  return result;
}
export async function saveUserLibrary(
  username: string,
  state: LibraryState,
): Promise<LibraryState> {
  if (!apiConfig.useMocks)
    return requestJson(`/users/${encodeURIComponent(username)}/library`, {
      method: "PUT",
      body: JSON.stringify(state),
    });
  try {
    if (typeof window !== "undefined")
      localStorage.setItem(libraryStorageKey(username), JSON.stringify(state));
  } catch {
    /* The demo can run without browser storage. */
  }
  return copy(state);
}
