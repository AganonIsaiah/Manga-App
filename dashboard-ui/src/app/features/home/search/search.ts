import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subscription, defer, finalize } from "rxjs";
import {
  DestroyRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { NgTemplateOutlet } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HomeStore } from "../../../services/home-store.services";
import { HomeApi } from "../../../services/home.services";
import type { MangaDetails } from "../../../models/manga.model";
import { Icons, LucideDynamicIcon } from "../../../shared/icons";
import { MangaCard } from "../manga-card/manga-card";
import { People } from "../people/people";
import { ServiceNotice } from "../../../shared/service-notice/service-notice";
@Component({
  selector: "manga-search",
  host: {
    class:
      "h-full min-h-0 w-full overflow-y-auto flex flex-col items-center gap-6 px-2 pb-6 justify-start",
    "[class.search-landing]": "!submitted()",
  },
  imports: [
    NgTemplateOutlet,
    FormsModule,
    LucideDynamicIcon,
    MangaCard,
    People,
    ServiceNotice,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./search.html",
})
export class Search {
  readonly store = inject(HomeStore);
  private readonly api = inject(HomeApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly icons = Icons;
  readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly submitted = computed(() => this.params().get("q")?.trim() ?? "");
  readonly query = signal("");
  readonly kind = signal("manga");
  readonly genre = signal("All genres");
  readonly status = signal("All statuses");
  readonly sort = signal("Relevance");
  readonly matches = signal<MangaDetails[]>([]);
  readonly loading = signal(false);
  readonly error = signal<Error | null>(null);
  readonly genres = computed(() => [
    "All genres",
    ...new Set(this.store.catalog().flatMap((m) => m.genres)),
  ]);
  readonly statuses = ["All statuses", "ongoing", "completed", "hiatus"];
  readonly sorts = ["Relevance", "Title A–Z", "Newest"];
  private readonly destroyRef = inject(DestroyRef);
  private requestSub?: Subscription;
  constructor() {
    effect(() => {
      const query = this.submitted();
      this.query.set(query);
      this.kind.set(query.startsWith("@") ? "users" : "manga");
      this.genre.set("All genres");
      this.status.set("All statuses");
      this.sort.set("Relevance");
    });
    effect(() => {
      const request = {
        query: this.submitted(),
        genre: this.genre(),
        status: this.status(),
        sort: this.sort(),
      };
      this.load(request);
    });
  }
  load(
    request = {
      query: this.submitted(),
      genre: this.genre(),
      status: this.status(),
      sort: this.sort(),
    },
  ): void {
    this.requestSub?.unsubscribe();
    if (!request.query) return;
    this.loading.set(true);
    this.error.set(null);
    this.requestSub = defer(() => this.api.getSearchFeed(request))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.matches.set(result.details),
        error: (error) =>
          this.error.set(
            error instanceof Error ? error : new Error("Unable to search."),
          ),
      });
  }
  navigate(query: string) {
    void this.router.navigate(["/home"], {
      queryParams: {
        ...this.route.snapshot.queryParams,
        tab: "search",
        q: query.trim() || null,
      },
    });
  }
  submit() {
    if (this.query().trim()) this.navigate(this.query());
  }
  selected(pill: string) {
    return this.query()
      .split(",")
      .map((t) => t.trim())
      .includes(pill);
  }
  toggle(pill: string) {
    const tokens = this.query()
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    this.query.set(
      (tokens.includes(pill)
        ? tokens.filter((t) => t !== pill)
        : [...tokens, pill]
      ).join(", "),
    );
  }
  reset() {
    this.genre.set("All genres");
    this.status.set("All statuses");
  }
}
