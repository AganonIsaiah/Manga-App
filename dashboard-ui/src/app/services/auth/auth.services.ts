import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  Observable,
  Subscription,
  catchError,
  defer,
  finalize,
  fromEvent,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
  timer,
} from "rxjs";
import { AUTH_CONFIG } from "../../config/auth.config";
import {
  mockLoginCredentials,
  mockRequestPasswordReset,
  mockSignIn,
  mockSignUp,
} from "../../mocks/auth-mocks";
import type {
  AuthSession,
  LoginCredentials,
  SignupCredentials,
} from "../../models/auth.model";
import { ApiError } from "../../models/api-client.model";
import { ApiClient } from "../api-client/api-client.services";
import { BrowserStorage } from "../browser-storage/browser-storage.services";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly api = inject(ApiClient);
  private readonly browser = inject(BrowserStorage);
  private readonly sessionValue = signal<AuthSession | null>(null);
  private readonly errorValue = signal("");
  readonly session = this.sessionValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly username = computed(() => this.session()?.user.username ?? null);
  private refreshRequest?: Observable<AuthSession>;
  private sessionGeneration = 0;
  get useMocks() {
    return this.config.useMocks;
  }

  constructor() {
    // Remove the obsolete auth key once; no auth data is ever read from browser storage.
    this.browser.remove("manga-session-v1", "localStorage");
    this.browser.remove("manga-session-v1", "sessionStorage");
    effect((onCleanup) => {
      const session = this.session();
      if (!session || !this.browser.window) return;
      const generation = this.sessionGeneration;
      let inFlight: Subscription | undefined;
      const expiry = timer(
        Math.max(
          0,
          session.expiresAt - Date.now() - (this.useMocks ? 0 : 30_000),
        ),
      ).subscribe(() => {
        if (generation !== this.sessionGeneration) return;
        if (this.useMocks) this.sessionValue.set(null);
        else
          inFlight = this.refresh().subscribe({
            error: () => {
              if (generation === this.sessionGeneration)
                this.sessionValue.set(null);
            },
          });
      });
      onCleanup(() => {
        expiry.unsubscribe();
        inFlight?.unsubscribe();
      });
    });
    if (this.browser.window)
      fromEvent(this.browser.window, "focus")
        .pipe(
          switchMap(() =>
            this.useMocks ? of(this.session()) : this.restore(),
          ),
          takeUntilDestroyed(),
        )
        .subscribe();
  }
  getSession() {
    return this.session();
  }

  restore(): Observable<AuthSession | null> {
    if (this.useMocks) return of(this.session());
    return defer(() => {
      const generation = this.sessionGeneration;
      return this.api.requestJson<AuthSession>("/auth/session").pipe(
        catchError((error) =>
          error instanceof ApiError && error.status === 401
            ? this.refresh()
            : throwError(() => error),
        ),
        tap((session) => {
          if (generation === this.sessionGeneration) {
            this.sessionValue.set(session);
            this.errorValue.set("");
          }
        }),
        catchError((error) => {
          if (generation === this.sessionGeneration) {
            this.sessionValue.set(null);
            this.errorValue.set(
              error instanceof ApiError && error.status === 401
                ? ""
                : "Unable to check your session. Please try signing in again.",
            );
          }
          return of(null);
        }),
      );
    });
  }
  refresh(): Observable<AuthSession> {
    if (!this.refreshRequest) {
      const generation = this.sessionGeneration;
      const request = this.api
        .requestJson<AuthSession>("/auth/refresh", { method: "POST", body: {} })
        .pipe(
          tap((session) => {
            if (generation === this.sessionGeneration)
              this.sessionValue.set(session);
          }),
          finalize(() => {
            if (this.refreshRequest === request)
              this.refreshRequest = undefined;
          }),
          shareReplay({ bufferSize: 1, refCount: true }),
        );
      this.refreshRequest = request;
    }
    return this.refreshRequest;
  }
  signIn(
    credentials: LoginCredentials,
    remember = false,
  ): Observable<AuthSession> {
    return defer(() => {
      ++this.sessionGeneration;
      this.refreshRequest = undefined;
      return this.useMocks
        ? mockSignIn(credentials).pipe(
            map((user) => ({
              user,
              expiresAt: Date.now() + this.config.sessionDurationMs,
            })),
          )
        : this.api.requestJson<AuthSession>("/auth/login", {
            method: "POST",
            body: { ...credentials, remember },
          });
    }).pipe(
      tap((session) => {
        this.sessionValue.set(session);
        this.errorValue.set("");
      }),
    );
  }
  signUp(credentials: SignupCredentials): Observable<string> {
    return defer(() =>
      this.useMocks
        ? mockSignUp(credentials)
        : this.api
            .requestJson<{
              message: string;
            }>("/auth/signup", { method: "POST", body: credentials })
            .pipe(map((result) => result.message)),
    );
  }
  signInToDemo(remember = false): Observable<AuthSession> {
    return defer(() => {
      if (!this.useMocks)
        throw new Error("Demo sign-in is unavailable with real accounts.");
      return this.signIn(mockLoginCredentials, remember);
    });
  }
  signOut(): Observable<void> {
    return defer(() =>
      this.useMocks
        ? of(undefined)
        : this.api.requestJson<void>("/auth/logout", {
            method: "POST",
            body: {},
          }),
    ).pipe(
      tap(() => {
        ++this.sessionGeneration;
        this.refreshRequest = undefined;
        this.sessionValue.set(null);
      }),
    );
  }
  requestPasswordReset(email: string): Observable<string> {
    return defer(() =>
      this.useMocks
        ? mockRequestPasswordReset(email)
        : this.api
            .requestJson<{
              message: string;
            }>("/auth/password-reset", { method: "POST", body: { email } })
            .pipe(map((result) => result.message)),
    );
  }
  confirmEmail(token: string): Observable<AuthSession> {
    return this.api
      .requestJson<AuthSession>("/auth/confirm-email", {
        method: "POST",
        body: { token },
      })
      .pipe(
        tap((session) => {
          ++this.sessionGeneration;
          this.refreshRequest = undefined;
          this.sessionValue.set(session);
          this.errorValue.set("");
        }),
      );
  }
  resetPassword(token: string, password: string): Observable<string> {
    return this.api
      .requestJson<{
        message: string;
      }>("/auth/reset-password", { method: "POST", body: { token, password } })
      .pipe(
        tap(() => {
          ++this.sessionGeneration;
          this.refreshRequest = undefined;
          this.sessionValue.set(null);
        }),
        map((result) => result.message),
      );
  }
  getLoginDestination(next: string | null) {
    return next === "/home" || next?.startsWith("/home?") ? next : "/home";
  }
}
