import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../services/auth/auth.services";
import { Icons, LucideDynamicIcon } from "../../shared/icons";

@Component({
  selector: "manga-reset-password",
  host: { class: "contents" },
  imports: [RouterLink, ReactiveFormsModule, LucideDynamicIcon],
  templateUrl: "./reset-password.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly icons = Icons;
  readonly token =
    new URLSearchParams(this.route.snapshot.fragment ?? "").get("token_hash") ??
    "";
  readonly pending = signal(false);
  readonly error = signal("");
  readonly message = signal("");
  readonly form = new FormGroup({
    password: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(256),
      ],
    }),
    confirm: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  constructor() {
    // Keep the reset secret only in this component's memory after opening the email link.
    if (this.route.snapshot.fragment)
      void this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        fragment: undefined,
      });
  }
  submit() {
    if (this.pending() || this.message()) return;
    this.form.markAllAsTouched();
    if (!this.token) {
      this.error.set(
        "This reset link is invalid. Request a new link from sign in.",
      );
      return;
    }
    if (this.form.invalid) {
      this.error.set("Use a password with at least 12 characters.");
      return;
    }
    const { password, confirm } = this.form.getRawValue();
    if (password !== confirm) {
      this.error.set("The passwords do not match.");
      return;
    }
    this.pending.set(true);
    this.error.set("");
    this.auth
      .resetPassword(this.token, password)
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (message) => {
          this.message.set(message);
          this.form.reset();
        },
        error: (error) =>
          this.error.set(
            error instanceof Error
              ? error.message
              : "Unable to reset your password. Please try again.",
          ),
      });
  }
}
