export type LibraryTab = "readings" | "bookmarks" | "reviews" | "profile";

type ProfileDetailsRatings = [number, number, number, number, number];

type ProfileDetailsReadings = [
  ProfileReadings,
  ProfileReadings,
  ProfileReadings,
  ProfileReadings,
];

export type NavbarProps = {
  counts: ProfileCounts;
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
};

export type HeaderProps = {
  profile: ProfileDetails;
  activeTab: LibraryTab;
};

export interface ProfileCounts {
  readings_count: number;
  bookmarks_count: number;
  reviews_count: number;
}

export interface ProfileReadings {
  title: string;
  cover_url: string;
  current_chapter: number;
  days_last_read: number;
  authors: string[];
}

export interface ProfileBookmarks {
  title: string;
  cover_url: string;
  date_bookmarked: string;
}

export interface ProfileMangaReviews {
  title: string;
  cover_url: string;
  rating: number;
  date_reviewed: string;
  review: string;
  is_public: boolean;
}

export interface ProfileDetails {
  name: string;
  username: string;

  read_this_year: number;
  read_all_time: number;

  date_joined: string;
  account_age_months: number;
  location: string;

  bio: string;
  header: string;

  following: string[];
  followers: string[];

  favourite_manga: ProfileDetailsReadings;
  recently_read: ProfileDetailsReadings;

  ratings: ProfileDetailsRatings;
}
