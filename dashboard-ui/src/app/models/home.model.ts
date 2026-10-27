export type Reader = {
  username: string;
  name: string;
  bio: string;
  color: string;
};
export type Review = { id: string; rating: number; text: string; date: string };
export type LibraryState = {
  bookmarks: string[];
  progress: Record<string, number>;
  following: string[];
  reviews: Review[];
  favouritePanels?: FavouritePanel[];
};
export type FavouritePanel = {
  id: string;
  title: string;
  chapter: number;
  image: string;
  description: string;
};
