
type MangaStatus = "ongoing" | "completed" | "hiatus";

export type ScrollerProps = {
  activeIndex: number;
  length: number;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (index: number) => void;
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
