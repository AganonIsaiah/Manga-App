import type {
  ProfileReadings,
  ProfileBookmarks,
  ProfileCounts,
  ProfileDetails,
  ProfileMangaReviews,
} from "./components/library/library.types";
import type { MangaDetails } from "./components/for-you/for-you-feed.types";

import type { Reader, LibraryState, FavouritePanel } from "./home.types";

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

// Service output models. Map the backend's DTOs to these shapes in home.service.ts.
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
