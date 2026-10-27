import { Injectable, computed, signal } from "@angular/core";
import type { UserProfileData } from "../../models/home-api.model";
import type { MangaDetails } from "../../models/manga.model";
import type { Reader } from "../../models/home.model";
import type { ProfileDetails } from "../../models/library.model";
import type {
  LibraryState as LibraryStateModel,
  Review,
  FavouritePanel,
} from "../../models/home.model";

@Injectable({ providedIn: "root" })
export class LibraryState {
  private readonly value = signal<LibraryStateModel>(this.emptyState());
  private readonly catalog = signal<MangaDetails[]>([]);
  private readonly originalProfile = signal<ProfileDetails | null>(null);
  private readonly originalPanels = signal<FavouritePanel[]>([]);
  readonly state = this.value.asReadonly();
  readonly favouritePanels = computed(
    () => this.state().favouritePanels ?? this.originalPanels(),
  );
  readonly bookmarks = computed(() => this.state().bookmarks);
  readonly progress = computed(() => this.state().progress);
  readonly following = computed(() => this.state().following);
  readonly reviews = computed(() => this.state().reviews);
  readonly readingIds = computed(() => Object.keys(this.progress()));
  readonly profile = computed(() => {
    const profile = this.originalProfile();
    return profile
      ? this.projectProfile(profile, this.state(), this.catalog())
      : null;
  });
  initialize(account: UserProfileData | null, catalog: MangaDetails[]) {
    this.catalog.set(catalog);
    this.originalProfile.set(account?.profile ?? null);
    this.originalPanels.set(structuredClone(account?.favouritePanels ?? []));
    this.value.set(
      account ? structuredClone(account.state) : this.emptyState(),
    );
  }
  setCatalog(catalog: MangaDetails[]) {
    this.catalog.set(catalog);
  }
  toggle(key: "bookmarks" | "following", id: string) {
    this.value.update((state) => ({
      ...state,
      [key]: state[key].includes(id)
        ? state[key].filter((value) => value !== id)
        : [...state[key], id],
    }));
    return this.state();
  }
  read(id: string, chapter?: number) {
    this.value.update((state) => ({
      ...state,
      progress: {
        ...state.progress,
        [id]: Math.min(
          this.latestChapter(id),
          Math.max(1, Math.trunc(chapter ?? state.progress[id] ?? 1) || 1),
        ),
      },
    }));
    return this.state();
  }
  saveReview(review: Review) {
    this.value.update((state) => ({
      ...state,
      reviews: [
        { ...review },
        ...state.reviews.filter((value) => value.id !== review.id),
      ],
    }));
    return this.state();
  }
  deleteReview(id: string) {
    this.value.update((state) => ({
      ...state,
      reviews: state.reviews.filter((review) => review.id !== id),
    }));
    return this.state();
  }
  addFavouritePanels(panels: FavouritePanel[]) {
    const merged = new Map(
      [...this.favouritePanels(), ...panels].map((panel) => [panel.id, panel]),
    );
    this.value.update((state) => ({
      ...state,
      favouritePanels: structuredClone([...merged.values()]),
    }));
    return this.state();
  }
  removeFavouritePanel(id: string) {
    const panels = this.favouritePanels().filter((panel) => panel.id !== id);
    this.value.update((state) => ({ ...state, favouritePanels: panels }));
    return this.state();
  }
  private validPanels(value: unknown): value is FavouritePanel[] {
    if (!Array.isArray(value)) return false;
    return (
      new Set(value.map((panel) => panel?.id)).size === value.length &&
      value.every(
        (panel) =>
          panel &&
          typeof panel.id === "string" &&
          panel.id.length > 0 &&
          typeof panel.title === "string" &&
          panel.title.length > 0 &&
          typeof panel.image === "string" &&
          panel.image.length > 0 &&
          typeof panel.description === "string" &&
          Number.isInteger(panel.chapter) &&
          panel.chapter >= 1,
      )
    );
  }
  storageKey(username: string) {
    return `manga-library-v2:${username}`;
  }
  private emptyState(): LibraryStateModel {
    return { bookmarks: [], progress: {}, following: [], reviews: [] };
  }
  // Saved state is user-controlled: reject invalid entries before they reach the UI.
  parseLibraryState(
    raw: string | null,
    catalog: MangaDetails[],
    readers: Reader[],
  ): LibraryStateModel | null {
    if (!raw) return null;
    try {
      const state = JSON.parse(raw) as LibraryStateModel;
      const mangaIds = new Set(catalog.map((m) => m.id));
      const readerIds = new Set(readers.map((r) => r.username));
      if (
        !state ||
        !Array.isArray(state.bookmarks) ||
        !state.bookmarks.every((id) => mangaIds.has(id)) ||
        !Array.isArray(state.following) ||
        !state.following.every((id) => readerIds.has(id)) ||
        !state.progress ||
        typeof state.progress !== "object" ||
        Array.isArray(state.progress) ||
        !Object.entries(state.progress).every(
          ([id, chapter]) =>
            mangaIds.has(id) &&
            Number.isInteger(chapter) &&
            chapter >= 1 &&
            chapter <= this.latestChapter(id, catalog),
        ) ||
        (state.favouritePanels !== undefined &&
          !this.validPanels(state.favouritePanels)) ||
        !Array.isArray(state.reviews) ||
        !state.reviews.every(
          (review) =>
            review &&
            mangaIds.has(review.id) &&
            Number.isInteger(review.rating) &&
            review.rating >= 1 &&
            review.rating <= 5 &&
            typeof review.text === "string" &&
            typeof review.date === "string",
        )
      )
        return null;
      return state;
    } catch {
      return null;
    }
  }
  latestChapter(id: string, catalog: MangaDetails[] = this.catalog()) {
    return (
      Number(
        catalog.find((m) => m.id === id)?.recent_chapter.replace(/\D/g, ""),
      ) || 1
    );
  }

  private projectProfile(
    profile: ProfileDetails,
    state: LibraryStateModel,
    catalog: MangaDetails[],
  ): ProfileDetails {
    return {
      ...profile,
      following: state.following,
      recently_read: Object.fromEntries(
        Object.entries(state.progress)
          .slice(-3)
          .reverse()
          .flatMap(([id, chapter]) => {
            const manga = catalog.find((manga) => manga.id === id);
            return manga
              ? [
                  [
                    id,
                    {
                      title: manga.title,
                      cover_url: manga.cover_url ?? "",
                      authors: manga.authors,
                      current_chapter: chapter,
                      days_last_read:
                        Object.values(profile.recently_read).find(
                          (previous) =>
                            previous.title === manga.title &&
                            previous.current_chapter === chapter,
                        )?.days_last_read ?? 0,
                    },
                  ],
                ]
              : [];
          }),
      ),
    };
  }
}
