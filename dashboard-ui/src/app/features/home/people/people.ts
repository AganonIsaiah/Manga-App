import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subscription, defer, finalize } from "rxjs";
import {
  DestroyRef,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { HomeApi } from "../../../services/home.services";
import { HomeStore } from "../../../services/home-store.services";
import type { Reader } from "../../../models/home.model";
import { ServiceNotice } from "../../../shared/service-notice/service-notice";
@Component({
  selector: "manga-people",
  host: { class: "contents" },
  imports: [RouterLink, ServiceNotice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./people.html",
})
export class People {
  readonly query = input("");
  readonly usernames = input<string[]>();
  readonly readers = signal<Reader[]>([]);
  readonly loading = signal(true);
  readonly error = signal<Error | null>(null);
  readonly store = inject(HomeStore);
  private readonly api = inject(HomeApi);
  private readonly destroyRef = inject(DestroyRef);
  private requestSub?: Subscription;
  constructor() {
    effect(() => {
      const request = { query: this.query(), usernames: this.usernames() };
      this.load(request);
    });
  }
  followed(reader: Reader) {
    return this.store.state().following.includes(reader.username);
  }
  load(request = { query: this.query(), usernames: this.usernames() }): void {
    this.requestSub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.requestSub = defer(() => this.api.getReaders(request))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (readers) => this.readers.set(readers),
        error: (error) =>
          this.error.set(
            error instanceof Error
              ? error
              : new Error("Unable to load readers."),
          ),
      });
  }
}
