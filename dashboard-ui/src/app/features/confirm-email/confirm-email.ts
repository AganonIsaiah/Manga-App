import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../services/auth/auth.services";
import { Icons, LucideDynamicIcon } from "../../shared/icons";

@Component({
  selector: "manga-confirm-email",
  host: { class: "contents" },
  imports: [RouterLink, LucideDynamicIcon],
  templateUrl: "./confirm-email.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmail {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly icons = Icons;
  readonly token =
    new URLSearchParams(this.route.snapshot.fragment ?? "").get("token_hash") ??
    "";
  readonly pending = signal(false);
  readonly complete = signal(false);
  readonly error = signal("");
  constructor() {
    if (this.route.snapshot.fragment)
      void this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        fragment: undefined,
      });
  }
  confirm() {
    if (this.pending() || this.complete() || !this.token) return;
    this.pending.set(true);
    this.error.set("");
    this.auth
      .confirmEmail(this.token)
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.complete.set(true),
        error: (error) =>
          this.error.set(
            error instanceof Error
              ? error.message
              : "Unable to confirm your email. Please try again.",
          ),
      });
  }
}
