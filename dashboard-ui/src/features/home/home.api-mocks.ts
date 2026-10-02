import type { MangaApiResponse } from "./home.api-types";
import {
  ProfileDetails,
  ProfileCounts,
} from "./components/library/library.types";

export const mockForYouFeed: MangaApiResponse = {
  details: [
    {
      id: "manga-002",
      title: "Neon Ronin",
      genres: ["Action", "Sci-Fi", "Mystery"],
      description:
        "sLorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, aperiam aspernatur, quibusdam laudantium voluptatem id tempore dolore, eligendi fuga asperiores ex molestias cumque perferendis in saepe exercitationem consectetur a ea.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, aperiam aspernatur, quibusdam laudantium voluptatem id tempore dolore, eligendi fuga asperiores ex molestias cumque perferendis in saepe exercitationem consectetur a ea. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, aperiam aspernatur, quibusdam laudantium voluptatem id tempore dolore, eligendi fuga asperiores ex molestias cumque perferendis in saepe exercitationem consectetur a ea.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, aperiam aspernatur, quibusdam laudantium voluptatem id tempore dolore, eligendi fuga asperiores ex molestias cumque perferendis in saepe exercitationem consectetur a ea. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, aperiam aspernatur, quibusdam laudantium voluptatem id tempore dolore, eligendi fuga asperiores ex molestias cumque perferendis in saepe exercitationem consectetur a ea.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, aperiam aspernatur, quibusdam laudantium voluptatem id tempore dolore, eligendi fuga asperiores ex molestias cumque perferendis in saepe exercitationem consectetur a ea.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, aperiam aspernatur, quibusdam laudantium voluptatem id tempore dolore, eligendi fuga asperiores ex molestias cumque perferendis in saepe exercitationem consectetur a ea. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, aperiam aspernatur, quibusdam laudantium voluptatem id tempore dolore, eligendi fuga asperiores ex molestias cumque perferendis in saepe exercitationem consectetur a ea.In a city governed by predictive machines, a disgraced swordsman investigates a crime the system insists never happened.",
      demographic: "Shounen",
      authors: ["Haru Nakamura"],
      artists: ["Emi Sato"],
      publication_year: "2022",
      status: "hiatus",
      recent_chapter: "Chapter 81",
      cover_url: "https://placehold.co/600x900/312044/ffffff?text=Neon+Ronin",
    },
    {
      id: "manga-003",
      title: "Tea at the Edge of Tomorrow",
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
  bio: "Lorem ipsum dolor sit amet co   LoremLorem ipsum dolor sit amet co Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis labore expedita autem nam hic, nemo suscipit odio corporis error eos sapiente facilis officiis numquam veniam laboriosam neque voluptates nihil iste!Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis labore expedita autem nam hic, nemo suscipit odio corporis error eos sapiente facilis officiis numquam veniam laboriosam neque voluptates nihil iste!Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis labore expedita autem nam hic, nemo suscipit odio corporis error eos sapiente facilis officiis numquam veniam laboriosa Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis labore expedita autem nam hic, nemo suscipit odio corporis error eos sapiente facilis officiis numquam veniam laboriosam neque voluptates nihil iste!m neque voluptates nihil iste!nsectetur adipisicing elit. Reiciendis labore at praesentium, eligendi quasi adipisci, dolorem, debitis aspernatur eaque placeat nihil tenetur reprehenderit beatae minus itaque fugit esse voluptatum suscipit. ipsum dolor sit amet consectetur adipisicing elit. Nobis labore expedita autem nam hic, nemo suscipit odio corporis error eos sapiente facilis officiis numquam veniam laboriosam neque voluptates nihil iste!Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis labore expedita autem nam hic, nemo suscipit odio corporis error eos sapiente facilis officiis numquam veniam laboriosam neque voluptates nihil iste!Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis labore expedita autem nam hic, nemo suscipit odio corporis error eos sapiente facilis officiis numquam veniam laboriosa   Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis labore expedita autem nam hic, nemo suscipit odio corporis error eos sapiente facilis officiis numquam veniam laboriosam neque voluptates nihil iste!m neque voluptates nihil iste!nsectetur adipisicing elit. Reiciendis labore at praesentium, eligendi quasi adipisci, dolorem, debitis aspernatur eaque placeat nihil tenetur reprehenderit beatae minus itaque fugit esse voluptatum suscipit.",
  header:
    "Here for strange worlds and stories. fqeqwfebqweifubqewufbfuewqibwfbiqewfbuqwieqfewbqewfbbfwquibfiwe",
  location: "string",
  ratings: {
    one_star: 10,
    two_stars: 3,
    three_stars: 5,
    four_stars: 7,
    five_stars: 2,
    total_ratings: 100
  },
  following: ["paperlantern", "manga_mira", "panelhopper", "inkandtea", "paperlantern", "manga_mira", "panelhopper", "inkandtea", "paperlantern", "manga_mira", "panelhopper", "inkandtea", "paperlantern", "manga_mira", "panelhopper", "inkandtea"],
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
      cover_url:
        "https://placehold.co/600x900/166534/ffffff?text=Frieren",
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
      cover_url:
        "https://placehold.co/600x900/1e3a8a/ffffff?text=Blue+Period",
      current_chapter: 68,
      days_last_read: 45,
      authors: ["Tsubasa Yamaguchi"],
    },
    manga_4: {
      title: "Chainsaw Man",
      cover_url:
        "https://placehold.co/600x900/991b1b/ffffff?text=Chainsaw+Man",
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
