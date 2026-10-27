type MangaStatus = "ongoing" | "completed" | "hiatus";

export interface MangaArtwork {
  image: string;
  description: string;
}

// Fields available from MangaDex GET /statistics/manga/{uuid}.
export interface MangaStatistics {
  rating: { average: number | null; bayesian: number | null };
  follows: number;
}

export interface MangaDetails {
  id: string;
  title: string;
  genres: string[];
  description: string;
  demographic: string;

  authors: string[];
  artists: string[];
  publication_year: string;
  status: MangaStatus;
  recent_chapter: string;

  cover_url?: string;
  panel?: MangaArtwork;
  back_cover?: MangaArtwork;
  statistics?: MangaStatistics;
}
