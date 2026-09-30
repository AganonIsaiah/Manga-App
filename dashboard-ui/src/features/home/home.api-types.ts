import { ProfileReadings, ProfileBookmarks, ProfileCounts, ProfileDetails, ProfileMangaReviews } from "./components/library/library.types";
import { MangaDetails } from "./components/for-you/for-you-feed.types";

export interface MangaApiResponse {
  details: MangaDetails[];
};


export interface UserProfileApiResponse {
  readings: ProfileReadings[];
  bookmarks: ProfileBookmarks[];
  reviews: ProfileMangaReviews[];
  profile: ProfileDetails;
  counts: ProfileCounts;
}