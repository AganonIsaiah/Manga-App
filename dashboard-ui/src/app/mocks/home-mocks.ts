import type {
  Reader,
  LibraryState,
  FavouritePanel,
} from "../models/home.model";
import type { MangaApiResponse } from "../models/home-api.model";
import { ProfileDetails, ProfileCounts } from "../models/library.model";

export const mockForYouFeed: MangaApiResponse = {
  details: [
    {
      id: "manga-002",
      title: "Neon Ronin: The Last Swordsman in a City That Forgot Tomorrow",
      statistics: { rating: { average: 8.76, bayesian: 8.62 }, follows: 24862 },
      panel: {
        image: "/panels/panel-0.svg",
        description:
          "Illustrative mock panel: a city skyline under the midnight moon",
      },
      back_cover: {
        image: "/panels/panel-0.svg",
        description:
          "Illustrative mock back-cover art: a city skyline under the midnight moon",
      },
      genres: ["Action", "Sci-Fi", "Mystery"],
      description:
        "In a city governed by predictive machines, a disgraced swordsman investigates a crime the system insists never happened. Following a trail of missing memories, he discovers that the only future worth fighting for is one nobody can predict.",
      demographic: "Shounen",
      authors: ["Haru Nakamura", "Akira Takahashi", "Mizuki Fujimoto"],
      artists: ["Emi Sato"],
      publication_year: "2022",
      status: "hiatus",
      recent_chapter: "Chapter 81",
      cover_url: "https://placehold.co/600x900/312044/ffffff?text=Neon+Ronin",
    },
    {
      id: "manga-003",
      title: "Tea at the Edge of Tomorrow",
      statistics: { rating: { average: 8.4, bayesian: 8.15 }, follows: 18204 },
      panel: {
        image: "/panels/panel-1.svg",
        description:
          "Illustrative mock panel: a quiet café between moments in time",
      },
      back_cover: {
        image: "/panels/panel-1.svg",
        description:
          "Illustrative mock back-cover art: a quiet café between moments in time",
      },
      genres: ["Slice of Life", "Romance", "Sci-Fi"],
      description:
        "A quiet café serves customers from different points in time, but its owner breaks the rules when she falls for a visitor whose future has vanished.",
      demographic: "Josei",
      authors: ["Mina Fujimoto"],
      artists: ["Yui Arai"],
      publication_year: "2023",
      status: "ongoing",
      recent_chapter: "Chapter 24",
      cover_url:
        "https://placehold.co/600x900/783f5d/ffffff?text=Tea+at+the+Edge+of+Tomorrow",
    },
    {
      id: "manga-004",
      title: "Iron Orchard",
      statistics: { rating: { average: 9.07, bayesian: 8.83 }, follows: 69431 },
      panel: {
        image: "/panels/panel-2.svg",
        description:
          "Illustrative mock panel: an enchanted forest beneath the moon",
      },
      back_cover: {
        image: "/panels/panel-2.svg",
        description:
          "Illustrative mock back-cover art: an enchanted forest beneath the moon",
      },
      genres: ["Fantasy", "Action", "Supernatural"],
      description:
        "In a kingdom where weapons grow from enchanted trees, an apprentice gardener discovers a forbidden blade bearing the memories of a fallen queen.",
      demographic: "Shounen",
      authors: ["Daichi Kuroda"],
      artists: ["Sora Ishikawa"],
      publication_year: "2021",
      status: "completed",
      recent_chapter: "Chapter 96",
      cover_url: "https://placehold.co/600x900/315c45/ffffff?text=Iron+Orchard",
    },
    {
      id: "manga-005",
      title: "Paper Moon Detective Club",
      statistics: { rating: { average: 8.14, bayesian: 7.92 }, follows: 12608 },
      panel: {
        image: "/panels/panel-0.svg",
        description:
          "Illustrative mock panel: the city after dark, where a new mystery begins",
      },
      back_cover: {
        image: "/panels/panel-0.svg",
        description:
          "Illustrative mock back-cover art: the city after dark, where a new mystery begins",
      },
      genres: ["Mystery", "Comedy", "School Life"],
      description:
        "Four students investigate supposedly paranormal incidents around their school and repeatedly uncover mysteries stranger than the ghosts they expected.",
      demographic: "Shoujo",
      authors: ["Nao Hoshino"],
      artists: ["Rika Abe"],
      publication_year: "2025",
      status: "ongoing",
      recent_chapter: "Chapter 18",
      cover_url:
        "https://placehold.co/600x900/395b8a/ffffff?text=Paper+Moon+Detective+Club",
    },
    {
      id: "manga-006",
      title: "Graveyard Shift Hero",
      statistics: { rating: { average: 8.68, bayesian: 8.51 }, follows: 41820 },
      panel: {
        image: "/panels/panel-0.svg",
        description:
          "Illustrative mock panel: a silent neighborhood during the graveyard shift",
      },
      back_cover: {
        image: "/panels/panel-0.svg",
        description:
          "Illustrative mock back-cover art: a silent neighborhood during the graveyard shift",
      },
      genres: ["Comedy", "Action", "Supernatural"],
      description:
        "An exhausted convenience-store clerk becomes the neighborhood's reluctant protector whenever monsters emerge during his overnight shift.",
      demographic: "Seinen",
      authors: ["Koji Watanabe"],
      artists: ["Koji Watanabe"],
      publication_year: "2020",
      status: "completed",
      recent_chapter: "Chapter 64",
      cover_url:
        "https://placehold.co/600x900/3f3f46/ffffff?text=Graveyard+Shift+Hero",
    },
    {
      id: "manga-007",
      title: "Cloud Harbor",
      statistics: { rating: { average: 9.12, bayesian: 8.95 }, follows: 86540 },
      panel: {
        image: "/panels/panel-2.svg",
        description:
          "Illustrative mock panel: an unfamiliar forest beyond the storm belt",
      },
      back_cover: {
        image: "/panels/panel-2.svg",
        description:
          "Illustrative mock back-cover art: an unfamiliar forest beyond the storm belt",
      },
      genres: ["Adventure", "Fantasy", "Coming of Age"],
      description:
        "A runaway mechanic joins the crew of a flying cargo ship and searches the storm belt for an island erased from every official map.",
      demographic: "Shounen",
      authors: ["Toma Endo"],
      artists: ["Mei Shibata"],
      publication_year: "2019",
      status: "ongoing",
      recent_chapter: "Chapter 143",
      cover_url: "https://placehold.co/600x900/477b9e/ffffff?text=Cloud+Harbor",
    },
    {
      id: "manga-008",
      title: "The Botanist and the Beast",
      statistics: { rating: { average: 8.71, bayesian: 8.56 }, follows: 36724 },
      panel: {
        image: "/panels/panel-2.svg",
        description:
          "Illustrative mock panel: moonlight falling across a mysterious garden",
      },
      back_cover: {
        image: "/panels/panel-2.svg",
        description:
          "Illustrative mock back-cover art: moonlight falling across a mysterious garden",
      },
      genres: ["Romance", "Fantasy", "Drama"],
      description:
        "A royal botanist sent to cure a cursed prince learns that the strange flowers overtaking his castle are protecting him from something worse.",
      demographic: "Josei",
      authors: ["Chiyo Matsuda"],
      artists: ["Akari Ono"],
      publication_year: "2022",
      status: "hiatus",
      recent_chapter: "Chapter 42",
      cover_url:
        "https://placehold.co/600x900/76523b/ffffff?text=The+Botanist+and+the+Beast",
    },
    {
      id: "manga-009",
      title: "Zero Signal",
      statistics: { rating: { average: 8.93, bayesian: 8.72 }, follows: 53190 },
      panel: {
        image: "/panels/panel-0.svg",
        description:
          "Illustrative mock panel: a city waiting for the final transmission",
      },
      back_cover: {
        image: "/panels/panel-0.svg",
        description:
          "Illustrative mock back-cover art: a city waiting for the final transmission",
      },
      genres: ["Thriller", "Sci-Fi", "Psychological"],
      description:
        "After every screen in Tokyo broadcasts a countdown with no known source, a radio engineer races to decode the final transmission before it reaches zero.",
      demographic: "Seinen",
      authors: ["Kenji Ito", "Mari Kagawa"],
      artists: ["Junpei Okada"],
      publication_year: "2024",
      status: "ongoing",
      recent_chapter: "Chapter 31",
      cover_url: "https://placehold.co/600x900/7a2929/ffffff?text=Zero+Signal",
    },
    {
      id: "manga-010",
      title: "Summer of Small Gods",
      statistics: { rating: { average: 9.01, bayesian: 8.85 }, follows: 47106 },
      panel: {
        image: "/panels/panel-2.svg",
        description:
          "Illustrative mock panel: a moonlit grove at the edge of the village",
      },
      back_cover: {
        image: "/panels/panel-2.svg",
        description:
          "Illustrative mock back-cover art: a moonlit grove at the edge of the village",
      },
      genres: ["Slice of Life", "Supernatural", "Drama"],
      description:
        "During her final summer in a rural village, a teenager befriends the fading household gods that everyone else has forgotten.",
      demographic: "Shoujo",
      authors: ["Kaede Miyazaki"],
      artists: ["Fumi Tanaka"],
      publication_year: "2018",
      status: "completed",
      recent_chapter: "Chapter 52",
      cover_url:
        "https://placehold.co/600x900/a46a3f/ffffff?text=Summer+of+Small+Gods",
    },
  ],
};

export const mockSuggestionPills: string[] = [
  "Action-packed adventures",
  "Dark fantasy",
  "Feel-good romance",
  "Mystery and suspense",
  "Slice of life",
  "Sci-fi worlds",
  "Sports and competition",
  "Comedy",
];

export const mockProfileDetails: ProfileDetails = {
  name: "Isaiah",
  username: "aganon33",
  date_joined: "June 2026",
  account_age_months: 3,
  read_all_time: 42,
  read_this_year: 18,
  bio: "Always chasing a story that stays with me. Fantasy worlds, quiet character moments, and a little mystery. Send me your next five-star read.",
  header: "Here for strange worlds and unforgettable stories.",
  location: "Toronto, Canada",
  ratings: {
    one_star: 10,
    two_stars: 3,
    three_stars: 5,
    four_stars: 7,
    five_stars: 2,
    total_ratings: 27,
  },
  following: ["paperlantern", "manga_mira", "panelhopper", "inkandtea"],
  followers: ["kaiju_reader", "shoujo_sky", "noirpanels"],
  favourite_manga: {
    manga_1: {
      title: "The Ember Knight",
      cover_url:
        "https://placehold.co/600x900/7c2d12/ffffff?text=The+Ember+Knight",
      current_chapter: 84,
      days_last_read: 2,
      authors: ["Hwandaeng"],
    },
    manga_2: {
      title: "Summer of Small Gods",
      cover_url:
        "https://placehold.co/600x900/a46a3f/ffffff?text=Summer+of+Small+Gods",
      current_chapter: 52,
      days_last_read: 7,
      authors: ["Kaede Miyazaki"],
    },
    manga_3: {
      title: "Witch Hat Atelier",
      cover_url:
        "https://placehold.co/600x900/334155/ffffff?text=Witch+Hat+Atelier",
      current_chapter: 76,
      days_last_read: 21,
      authors: ["Kamome Shirahama"],
    },
    manga_4: {
      title: "Frieren: Beyond Journey's End",
      cover_url: "https://placehold.co/600x900/166534/ffffff?text=Frieren",
      current_chapter: 140,
      days_last_read: 30,
      authors: ["Kanehito Yamada"],
    },
  },
  recently_read: {
    manga_1: {
      title: "The Ember Knight",
      cover_url:
        "https://placehold.co/600x900/7c2d12/ffffff?text=The+Ember+Knight",
      current_chapter: 84,
      days_last_read: 1,
      authors: ["Hwandaeng"],
    },
    manga_2: {
      title: "Dandadan",
      cover_url: "https://placehold.co/600x900/581c87/ffffff?text=Dandadan",
      current_chapter: 169,
      days_last_read: 33,
      authors: ["Yukinobu Tatsu"],
    },
    manga_3: {
      title: "Blue Period",
      cover_url: "https://placehold.co/600x900/1e3a8a/ffffff?text=Blue+Period",
      current_chapter: 68,
      days_last_read: 45,
      authors: ["Tsubasa Yamaguchi"],
    },
    manga_4: {
      title: "Chainsaw Man",
      cover_url: "https://placehold.co/600x900/991b1b/ffffff?text=Chainsaw+Man",
      current_chapter: 218,
      days_last_read: 512,
      authors: ["Tatsuki Fujimoto"],
    },
  },
};

export const mockProfileCounts: ProfileCounts = {
  readings_count: 4,
  bookmarks_count: 10,
  reviews_count: 200,
};

export const catalog = mockForYouFeed.details;
export const readers: Reader[] = [
  {
    username: "paperlantern",
    name: "Ren Tanaka",
    bio: "Quiet stories, big feelings. Fantasy & slice of life.",
    color: "#66518a",
  },
  {
    username: "manga_mira",
    name: "Mira",
    bio: "One more chapter. Always. Romance & adventure.",
    color: "#a35c54",
  },
  {
    username: "panelhopper",
    name: "Alex Chen",
    bio: "Collecting panels and impossible worlds. Sci-fi & mystery.",
    color: "#466f83",
  },
  {
    username: "inkandtea",
    name: "Sora",
    bio: "A cup of tea and a good manga. Drama & fantasy.",
    color: "#658367",
  },
  {
    username: "kaiju_reader",
    name: "Kai",
    bio: "Here for the action and the incredible art.",
    color: "#a47743",
  },
  {
    username: "shoujo_sky",
    name: "Sky",
    bio: "Romance, found family, and happy endings.",
    color: "#80618b",
  },
  {
    username: "noirpanels",
    name: "Noah",
    bio: "Mysteries that keep me up at night.",
    color: "#4e6980",
  },
];
export const mockInitialLibraryState: LibraryState = {
  bookmarks: [catalog[2].id, catalog[5].id, catalog[6].id],
  progress: { [catalog[0].id]: 12, [catalog[1].id]: 8, [catalog[4].id]: 64 },
  following: ["paperlantern", "manga_mira", "panelhopper", "inkandtea"],
  reviews: [
    {
      id: catalog[2].id,
      rating: 5,
      text: "A beautiful world with a surprisingly human heart. The way memories become part of the story made the ending stay with me.",
      date: "2026-10-20",
    },
    {
      id: catalog[1].id,
      rating: 4,
      text: "Come for the time-travel premise, stay for the small moments between the characters. Such a comforting read.",
      date: "2026-10-18",
    },
  ],
};

export const mockPublicLibrary: LibraryState = {
  bookmarks: catalog.slice(3, 6).map((m) => m.id),
  progress: Object.fromEntries(catalog.slice(1, 5).map((m) => [m.id, 8])),
  following: ["paperlantern", "manga_mira"],
  reviews: [
    {
      id: catalog[2].id,
      rating: 5,
      text: "A story I keep coming back to. The world and its characters feel so alive.",
      date: "2026-10-21",
    },
  ],
};
export const mockProfileAvatarColor = "#d9a99c";
export function getMockReaderProfile(reader: Reader): ProfileDetails {
  return {
    ...mockProfileDetails,
    name: reader.name,
    username: reader.username,
    bio: reader.bio,
    header: reader.bio,
    followers: ["kaiju_reader", "shoujo_sky"],
    following: mockPublicLibrary.following.filter(
      (username) => username !== reader.username,
    ),
  };
}
export const mockFavouritePanels: FavouritePanel[] = [
  {
    id: "panel-0",
    title: catalog[0].title,
    chapter: 12,
    image: "/panels/panel-0.svg",
    description: "Illustrative mock panel: a city at midnight",
  },
  {
    id: "panel-1",
    title: catalog[1].title,
    chapter: 8,
    image: "/panels/panel-1.svg",
    description: "Illustrative mock panel: a quiet café",
  },
  {
    id: "panel-2",
    title: catalog[2].title,
    chapter: 36,
    image: "/panels/panel-2.svg",
    description: "Illustrative mock panel: a magical forest",
  },
];

export const mockPanelSuggestions: FavouritePanel[] = [
  ...mockFavouritePanels,
  ...catalog.slice(3).map((manga, index) => ({
    id: `panel-${manga.id}`,
    title: manga.title,
    chapter: [7, 18, 24, 16, 9, 28][index],
    image: manga.panel!.image,
    description: manga.panel!.description,
  })),
];

export function getMockCurrentProfile(state: LibraryState): ProfileDetails {
  return {
    ...mockProfileDetails,
    following: state.following,
    recently_read: Object.fromEntries(
      Object.entries(state.progress)
        .slice(-3)
        .reverse()
        .map(([id, chapter]) => {
          const manga = catalog.find((m) => m.id === id)!;
          return [
            id,
            {
              title: manga.title,
              cover_url: manga.cover_url ?? "",
              authors: manga.authors,
              current_chapter: chapter,
              days_last_read: 0,
            },
          ];
        }),
    ),
  };
}

export const mockReadingMood = "Strange worlds. Good company.";

export function getMockSearchFeed({
  query,
  genre = "All genres",
  status = "All statuses",
  sort = "Relevance",
}: import("../models/home-api.model").SearchRequest): MangaApiResponse {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 2 &&
        !["and", "the", "like", "with", "that", "manga", "story"].includes(
          token,
        ),
    );
  const ranked = catalog.map((manga) => ({
    manga,
    score: tokens.filter((token) =>
      `${manga.title} ${manga.authors.join(" ")} ${manga.genres.join(" ")} ${manga.description}`
        .toLowerCase()
        .includes(token),
    ).length,
  }));
  const results = ranked
    .filter(
      ({ manga, score }) =>
        score > 0 &&
        (genre === "All genres" || manga.genres.includes(genre)) &&
        (status === "All statuses" || manga.status === status),
    )
    .sort((a, b) =>
      sort === "Title A–Z"
        ? a.manga.title.localeCompare(b.manga.title)
        : sort === "Newest"
          ? Number(b.manga.publication_year) - Number(a.manga.publication_year)
          : b.score - a.score,
    );
  return { details: results.map((result) => result.manga) };
}
export function getMockProfileData(
  username: string,
): import("../models/home-api.model").UserProfileData | null {
  const reader = readers.find((reader) => reader.username === username);
  if (!reader && username !== mockProfileDetails.username) return null;
  return {
    profile: reader ? getMockReaderProfile(reader) : mockProfileDetails,
    state: reader ? mockPublicLibrary : mockInitialLibraryState,
    favouritePanels: mockFavouritePanels,
    readingMood: mockReadingMood,
    avatarColor: reader?.color ?? mockProfileAvatarColor,
  };
}

export function getMockReaders({
  query = "",
  usernames,
}: import("../models/home-api.model").ReaderRequest = {}): Reader[] {
  return readers.filter(
    (reader) =>
      (!usernames || usernames.includes(reader.username)) &&
      `${reader.name} ${reader.username} ${reader.bio}`
        .toLowerCase()
        .includes(query.trim().toLowerCase().replace(/^@/, "")),
  );
}

export function getMockEmptyAccount(
  user: import("../models/auth.model").AuthUser,
): import("../models/home-api.model").UserProfileData {
  return {
    profile: {
      ...mockProfileDetails,
      name: user.name,
      username: user.username,
      read_this_year: 0,
      read_all_time: 0,
      bio: "",
      header: "Your next story starts here.",
      following: [],
      followers: [],
      favourite_manga: {},
      recently_read: {},
      ratings: {
        one_star: 0,
        two_stars: 0,
        three_stars: 0,
        four_stars: 0,
        five_stars: 0,
        total_ratings: 0,
      },
      location: "",
      date_joined: "",
      account_age_months: 0,
    },
    state: {
      following: [],
      bookmarks: [],
      progress: {},
      reviews: [],
      favouritePanels: [],
    },
    favouritePanels: [],
    readingMood: "What will you read next?",
    avatarColor: "#d9aa9d",
  };
}
