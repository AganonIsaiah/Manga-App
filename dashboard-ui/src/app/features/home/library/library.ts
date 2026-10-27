import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subscription, defer } from "rxjs";
import {
  DestroyRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { HomeStore } from "../../../services/home-store.services";
import { HomeApi } from "../../../services/home.services";
import type { UserProfileData } from "../../../models/home-api.model";
import type { Review } from "../../../models/home.model";
import type { LibraryTab } from "../../../models/library.model";
import { Icons, LucideDynamicIcon } from "../../../shared/icons";
import { Profile } from "./profile/profile";
import { MangaCard } from "../manga-card/manga-card";
import { Modal } from "../../../shared/modal/modal";
import { People } from "../people/people";
import { ServiceNotice } from "../../../shared/service-notice/service-notice";
@Component({
  selector: "manga-library",
  host: { class: "contents" },
  imports: [
    FormsModule,
    RouterLink,
    LucideDynamicIcon,
    Profile,
    MangaCard,
    Modal,
    People,
    ServiceNotice,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./library.html",
})
export class Library {
  readonly store = inject(HomeStore);
  private readonly api = inject(HomeApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly icons = Icons;
  readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly requested = computed(() => this.params().get("user"));
  readonly isPublic = computed(
    () => !!this.requested() && this.requested() !== this.store.auth.username(),
  );
  readonly publicView = signal<UserProfileData | null>(null);
  readonly error = signal<Error | null>(null);
  readonly notFound = computed(
    () =>
      this.error() !== null &&
      "status" in this.error()! &&
      (this.error() as Error & { status: number }).status === 404,
  );
  private readonly destroyRef = inject(DestroyRef);
  private requestSub?: Subscription;
  readonly view = computed(() =>
    this.isPublic() ? this.publicView() : this.store.account(),
  );
  readonly profile = computed(() => {
    const view = this.view();
    return view
      ? this.isPublic()
        ? view.profile
        : this.store.profile()
      : null;
  });
  readonly state = computed(() =>
    this.isPublic() ? this.view()!.state : this.store.state(),
  );
  readonly tab = signal<LibraryTab>("profile");
  readonly tabs: LibraryTab[] = ["profile", "readings", "bookmarks", "reviews"];
  readonly connections = signal<"followers" | "following" | null>(null);
  readonly query = signal("");
  readonly filter = signal("All");
  readonly filters = ["All", "Reading", "Completed"];
  readonly draft = signal<Review | null>(null);
  readonly stars = [0, 1, 2, 3, 4];
  readonly ratings = [5, 4, 3, 2, 1];
  readonly list = computed(() => {
    const state = this.state();
    const ids =
      this.tab() === "readings" ? Object.keys(state.progress) : state.bookmarks;
    return this.store
      .catalog()
      .filter(
        (m) =>
          ids.includes(m.id) &&
          m.title.toLowerCase().includes(this.query().toLowerCase()),
      )
      .filter(
        (m) =>
          this.tab() !== "readings" ||
          this.filter() === "All" ||
          (this.filter() === "Completed"
            ? (state.progress[m.id] ?? 1) >= this.latest(m.id)
            : (state.progress[m.id] ?? 1) < this.latest(m.id)),
      );
  });
  readonly connectionNames = computed(() =>
    this.connections() === "followers"
      ? (this.profile()?.followers ?? [])
      : (this.profile()?.following ?? []),
  );
  constructor() {
    effect(() => {
      const name = this.requested();
      const isPublic = this.isPublic();
      this.tab.set("profile");
      this.query.set("");
      this.filter.set("All");
      this.connections.set(null);
      this.draft.set(null);
      this.publicView.set(null);
      this.error.set(null);
      this.requestSub?.unsubscribe();
      if (isPublic && name) this.load(name);
    });
  }
  load(name = this.requested()): void {
    this.requestSub?.unsubscribe();
    this.error.set(null);
    if (!name) return;
    this.requestSub = defer(() => this.api.getUserProfile(name))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (view) => this.publicView.set(view),
        error: (error) =>
          this.error.set(
            error instanceof Error
              ? error
              : new Error("Unable to load reader."),
          ),
      });
  }
  changeTab(tab: LibraryTab) {
    this.tab.set(tab);
    this.query.set("");
    this.filter.set("All");
  }
  count(tab: LibraryTab) {
    const state = this.state();
    return tab === "readings"
      ? Object.keys(state.progress).length
      : tab === "bookmarks"
        ? state.bookmarks.length
        : tab === "reviews"
          ? state.reviews.length
          : null;
  }
  latest(id: string) {
    return this.store.library.latestChapter(id);
  }
  title(id: string) {
    return this.store.catalog().find((m) => m.id === id)?.title ?? id;
  }
  startReview() {
    const catalog = this.store.catalog();
    const id =
      catalog.find(
        (m) => !this.store.state().reviews.some((r) => r.id === m.id),
      )?.id ?? catalog[0]?.id;
    if (id)
      this.draft.set({
        id,
        rating: 5,
        text: "",
        date: new Date().toLocaleDateString("en-CA"),
      });
  }
  edit(review: Review) {
    this.draft.set({ ...review });
  }
  patchDraft(patch: Partial<Review>) {
    this.draft.update((draft) => (draft ? { ...draft, ...patch } : null));
  }
  saveReview() {
    const draft = this.draft();
    if (draft?.text.trim() && this.store.saveReview(draft))
      this.draft.set(null);
  }
  signOut() {
    this.store.auth.signOut();
    void this.router.navigateByUrl("/login", { replaceUrl: true });
  }
  loginParams() {
    return { next: this.router.url };
  }
}
