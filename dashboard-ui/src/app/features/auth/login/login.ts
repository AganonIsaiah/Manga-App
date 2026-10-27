import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, finalize, from, switchMap, tap } from "rxjs";
import {
  DestroyRef,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../services/auth.services";
import { Icons, LucideDynamicIcon } from "../../../shared/icons";
@Component({
  selector: "manga-login",
  host: { class: "contents" },
  imports: [RouterLink, ReactiveFormsModule, LucideDynamicIcon],
  templateUrl: "./login.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly icons = Icons;
  readonly demoEnabled = this.auth.useMocks;
  readonly visible = signal(false);
  readonly reset = signal(false);
  readonly pending = signal(false);
  readonly error = signal("");
  readonly message = signal("");
  readonly heading = viewChild<ElementRef<HTMLHeadingElement>>("heading");
  readonly form = new FormGroup({
    identifier: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(254)],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(256)],
    }),
    remember: new FormControl(false, { nonNullable: true }),
  });
  readonly recovery = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    }),
  });
  constructor() {
    if (this.auth.username())
      void this.router.navigateByUrl(this.destination(), { replaceUrl: true });
  }
  destination() {
    return this.auth.getLoginDestination(
      this.route.snapshot.queryParamMap.get("next"),
    );
  }
  changeView(reset: boolean) {
    this.reset.set(reset);
    this.error.set("");
    this.message.set("");
    queueMicrotask(() => this.heading()?.nativeElement.focus());
  }
  clearMessages() {
    this.error.set("");
    this.message.set("");
  }
  submit(demo = false): void {
    if (this.pending()) return;
    if (!demo && (this.reset() ? this.recovery.invalid : this.form.invalid)) {
      (this.reset() ? this.recovery : this.form).markAllAsTouched();
      return;
    }
    this.pending.set(true);
    this.clearMessages();
    let operation: Observable<unknown>;
    if (this.reset() && !demo) {
      operation = this.auth
        .requestPasswordReset(this.recovery.controls.email.value)
        .pipe(tap((message) => this.message.set(message)));
    } else {
      const credentials = this.form.getRawValue();
      const login = demo
        ? this.auth.signInToDemo(credentials.remember)
        : this.auth.signIn(
            {
              identifier: credentials.identifier,
              password: credentials.password,
            },
            credentials.remember,
          );
      operation = login.pipe(
        tap(() => this.form.controls.password.reset()),
        switchMap(() =>
          from(
            this.router.navigateByUrl(this.destination(), { replaceUrl: true }),
          ),
        ),
      );
    }
    operation
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error) =>
          this.error.set(
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
          ),
      });
  }
}
