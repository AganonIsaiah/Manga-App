type MangaStatus = "ongoing" | "completed" | "hiatus";

export interface MangaDetails {
  id: string;
  title: string;
  genres: string[];
  description: string;
  demographic: string,

  authors: string[];
  artists: string[];
  publicationYear: string;
  status: MangaStatus;
  recentChapter: string;

  coverUrl?: string;
};

export interface MangaApiResponse {
  details: MangaDetails[];
};
