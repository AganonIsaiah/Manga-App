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
  selector: "manga-signup",
  host: { class: "contents" },
  imports: [ReactiveFormsModule, RouterLink, LucideDynamicIcon],
  templateUrl: "./signup.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly icons = Icons;
  readonly visible = signal(false);
  readonly pending = signal(false);
  readonly error = signal("");
  readonly message = signal("");
  readonly destination = this.auth.getLoginDestination(
    this.route.snapshot.queryParamMap.get("next"),
  );
  readonly form = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(80),
      ],
    }),
    username: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9_]{3,24}$/),
      ],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(256),
      ],
    }),
  });
  constructor() {
    if (this.auth.username())
      void this.router.navigateByUrl(this.destination, { replaceUrl: true });
  }
  clearMessages() {
    this.error.set("");
  }
  submit() {
    if (this.pending() || this.message()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.pending.set(true);
    this.error.set("");
    this.auth
      .signUp(this.form.getRawValue())
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (message) => {
          this.message.set(message);
          this.form.controls.password.reset();
        },
        error: (error) =>
          this.error.set(
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
          ),
      });
  }
}
