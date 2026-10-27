import type {
  ProfileReadings,
  ProfileBookmarks,
  ProfileCounts,
  ProfileDetails,
  ProfileMangaReviews,
} from "./library.model";
import type { MangaDetails } from "./manga.model";

import type { Reader, LibraryState, FavouritePanel } from "./home.model";

export interface MangaApiResponse {
  details: MangaDetails[];
}

export interface UserProfileApiResponse {
  readings: ProfileReadings[];
  bookmarks: ProfileBookmarks[];
  reviews: ProfileMangaReviews[];
  profile: ProfileDetails;
  counts: ProfileCounts;
}

// Service output models. Map the backend's DTOs to these shapes in home.services.ts.
export interface HomeData {
  catalog: MangaDetails[];
  readers: Reader[];
  suggestions: string[];
  recommendations: MangaDetails[];
}
export interface UserProfileData {
  profile: ProfileDetails;
  state: LibraryState;
  favouritePanels: FavouritePanel[];
  readingMood: string;
  avatarColor: string;
}
export interface SearchRequest {
  query: string;
  genre?: string;
  status?: string;
  sort?: string;
}

export interface ReaderRequest {
  query?: string;
  usernames?: string[];
}

export interface LibrarySaveRequest {
  username: string;
  snapshot: LibraryState;
  version: number;
}
