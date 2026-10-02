
type MangaStatus = "ongoing" | "completed" | "hiatus";

export type ScrollerProps = {
  onNext: () => void;
  onPrevious: () => void;
};

export interface MangaDetails {
  id: string;
  title: string;
  genres: string[];
  description: string;
  demographic: string,

  authors: string[];
  artists: string[];
  publication_year: string;
  status: MangaStatus;
  recent_chapter: string;

  cover_url?: string;
};
