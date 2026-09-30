export type LibraryTab = "readings" | "bookmarks" | "reviews" | "profile";

export type NavbarProps = {
  counts: ProfileCounts;
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
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
  days_last_read: string;
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
  location: string;
  date_joined: string;
  account_age_months: number;
  bio: string;
  header: string;
  socials?: string[];
}