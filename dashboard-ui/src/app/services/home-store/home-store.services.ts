import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  EMPTY,
  Subject,
  Subscription,
  catchError,
  concatMap,
  defer,
  finalize,
  tap,
} from "rxjs";
import {
  DestroyRef,
  Injectable,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../auth/auth.services";
import { HomeApi } from "../home/home.services";
import { LibraryState } from "../library-state/library-state.services";
import type {
  HomeData,
  UserProfileData,
  LibrarySaveRequest,
} from "../../models/home-api.model";
import type {
  LibraryState as LibraryStateModel,
  Review,
  FavouritePanel,
} from "../../models/home.model";

@Injectable({ providedIn: "root" })
export class HomeStore {
  private readonly api = inject(HomeApi);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly dataValue = signal<HomeData | null>(null);
  private readonly accountValue = signal<UserProfileData | null>(null);
  readonly library = inject(LibraryState);
  readonly state = this.library.state;
  readonly profile = this.library.profile;
  private readonly homeErrorValue = signal<Error | null>(null);
  private readonly accountErrorValue = signal<Error | null>(null);
  private readonly saveErrorValue = signal<Error | null>(null);
  private readonly homeLoadingValue = signal(true);
  private readonly accountLoadingValue = signal(false);
  readonly data = this.dataValue.asReadonly();
  readonly account = this.accountValue.asReadonly();
  readonly homeError = this.homeErrorValue.asReadonly();
  readonly accountError = this.accountErrorValue.asReadonly();
  readonly saveError = this.saveErrorValue.asReadonly();
  readonly homeLoading = this.homeLoadingValue.asReadonly();
  readonly accountLoading = this.accountLoadingValue.asReadonly();
  readonly catalog = computed(() => this.data()?.catalog ?? []);
  readonly ready = computed(
    () =>
      !!this.data() &&
      (!this.auth.username() ||
        this.account()?.profile.username === this.auth.username()),
  );
  private version = 0;
  private readonly destroyRef = inject(DestroyRef);
  private readonly saves = new Subject<LibrarySaveRequest>();
  private homeRequest?: Subscription;
  private accountRequest?: Subscription;
  constructor() {
    this.saves
      .pipe(
        concatMap((request) =>
          defer(() =>
            this.api.saveUserLibrary(request.username, request.snapshot),
          ).pipe(
            tap(() => {
              if (this.isCurrentSave(request)) this.saveErrorValue.set(null);
            }),
            catchError((error) => {
              if (this.isCurrentSave(request))
                this.saveErrorValue.set(this.asError(error));
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
    this.loadHome();
    effect(() => {
      const username = this.auth.username();
      untracked(() => {
        this.loadAccount(username);
      });
    });
  }
  loadHome(): void {
    this.homeRequest?.unsubscribe();
    this.homeLoadingValue.set(true);
    this.homeErrorValue.set(null);
    this.homeRequest = defer(() => this.api.getHomeData())
      .pipe(
        finalize(() => this.homeLoadingValue.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.dataValue.set(data);
          this.library.setCatalog(data.catalog);
        },
        error: (error) => this.homeErrorValue.set(this.asError(error)),
      });
  }
  loadAccount(username: string | null): void {
    ++this.version;
    this.accountRequest?.unsubscribe();
    this.accountValue.set(null);
    this.library.initialize(null, this.catalog());
    this.accountErrorValue.set(null);
    this.saveErrorValue.set(null);
    this.accountLoadingValue.set(!!username);
    if (!username) return;
    this.accountRequest = defer(() => this.api.getUserProfile(username))
      .pipe(
        finalize(() => this.accountLoadingValue.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (account) => {
          this.accountValue.set(account);
          this.library.initialize(account, this.catalog());
        },
        error: (error) => this.accountErrorValue.set(this.asError(error)),
      });
  }
  requireSignIn() {
    if (
      this.auth.username() &&
      this.account()?.profile.username === this.auth.username()
    )
      return true;
    void this.router.navigate(["/login"], {
      queryParams: { next: this.router.url },
    });
    return false;
  }
  toggleBookmark(id: string) {
    return this.toggle("bookmarks", id);
  }
  toggleFollow(id: string) {
    return this.toggle("following", id);
  }
  private toggle(key: "bookmarks" | "following", id: string) {
    if (!this.requireSignIn()) return false;
    this.persist(this.library.toggle(key, id));
    return true;
  }
  read(id: string, chapter?: number) {
    if (!this.requireSignIn()) return false;
    this.persist(this.library.read(id, chapter));
    return true;
  }
  saveReview(review: Review) {
    if (!this.requireSignIn()) return false;
    this.persist(this.library.saveReview(review));
    return true;
  }
  deleteReview(id: string) {
    if (!this.requireSignIn()) return false;
    this.persist(this.library.deleteReview(id));
    return true;
  }
  addFavouritePanels(panels: FavouritePanel[]) {
    if (!this.requireSignIn()) return false;
    this.persist(this.library.addFavouritePanels(panels));
    return true;
  }
  removeFavouritePanel(id: string) {
    if (!this.requireSignIn()) return false;
    this.persist(this.library.removeFavouritePanel(id));
    return true;
  }
  retrySave() {
    this.persist(this.state());
  }
  private persist(snapshot: LibraryStateModel): void {
    const username = this.auth.username();
    if (username)
      this.saves.next({ username, snapshot, version: this.version });
  }
  private isCurrentSave(request: LibrarySaveRequest) {
    return (
      request.version === this.version &&
      request.username === this.auth.username()
    );
  }
  private asError(error: unknown) {
    return error instanceof Error
      ? error
      : new Error("Unable to load or save data. Please try again.");
  }
}
