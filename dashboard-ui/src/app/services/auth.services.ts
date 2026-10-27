import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, defer, fromEvent, map, tap, timer } from "rxjs";
import { API_CONFIG } from "../config/api.config";
import { AUTH_CONFIG } from "../config/auth.config";
import {
  mockLoginCredentials,
  mockRequestPasswordReset,
  mockSignIn,
} from "../mocks/auth-mocks";
import type { AuthSession, LoginCredentials } from "../models/auth.model";
import { BrowserStorage } from "./browser-storage.services";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly storage = inject(BrowserStorage);
  private readonly config = inject(AUTH_CONFIG);
  private readonly apiConfig = inject(API_CONFIG);
  get useMocks() {
    return this.apiConfig.useMocks && this.config.useMocks;
  }
  private memorySession: AuthSession | null = null;
  private readonly sessionValue = signal<AuthSession | null>(
    this.readSession(),
  );
  readonly session = this.sessionValue.asReadonly();
  readonly username = computed(() => this.session()?.user.username ?? null);
  constructor() {
    if (this.storage.window)
      fromEvent(this.storage.window, "storage")
        .pipe(takeUntilDestroyed())
        .subscribe(() => this.refreshSession());
    effect((onCleanup) => {
      const session = this.session();
      if (!session || !this.storage.window) return;
      const expiry = timer(
        Math.max(0, session.expiresAt - Date.now()),
      ).subscribe(() => this.refreshSession());
      onCleanup(() => expiry.unsubscribe());
    });
  }
  getSession() {
    this.refreshSession();
    return this.session();
  }
  refreshSession() {
    this.sessionValue.set(this.readSession());
  }
  private readSession(): AuthSession | null {
    if (!this.storage.window || !this.useMocks) return null;
    for (const scope of ["localStorage", "sessionStorage"] as const) {
      try {
        const value: unknown = JSON.parse(
          this.storage.read(this.config.sessionKey, scope) ?? "null",
        );
        if (this.isSession(value)) return value;
      } catch {
        /* Ignore invalid persisted sessions. */
      }
    }
    return this.isSession(this.memorySession) ? this.memorySession : null;
  }
  private isSession(value: unknown): value is AuthSession {
    if (!value || typeof value !== "object") return false;
    const session = value as Partial<AuthSession>;
    return (
      typeof session.expiresAt === "number" &&
      session.expiresAt > Date.now() &&
      !!session.user &&
      typeof session.user.id === "string" &&
      typeof session.user.name === "string" &&
      typeof session.user.username === "string"
    );
  }
  private requireAdapter() {
    if (!this.useMocks)
      throw new Error(
        "Sign-in is temporarily unavailable. Please try again later.",
      );
  }
  signIn(
    credentials: LoginCredentials,
    remember = false,
  ): Observable<AuthSession> {
    return defer(() => {
      this.requireAdapter();
      return mockSignIn(credentials);
    }).pipe(
      map((user) => ({
        user,
        expiresAt: Date.now() + this.config.sessionDurationMs,
      })),
      tap((session) => {
        this.clearStoredSessions();
        this.memorySession = this.storage.write(
          this.config.sessionKey,
          JSON.stringify(session),
          remember ? "localStorage" : "sessionStorage",
        )
          ? null
          : session;
        this.sessionValue.set(session);
      }),
    );
  }
  signInToDemo(remember = false) {
    return this.signIn(mockLoginCredentials, remember);
  }
  signOut() {
    this.memorySession = null;
    this.clearStoredSessions();
    this.sessionValue.set(null);
  }
  private clearStoredSessions() {
    this.storage.remove(this.config.sessionKey, "localStorage");
    this.storage.remove(this.config.sessionKey, "sessionStorage");
  }
  requestPasswordReset(email: string) {
    return defer(() => {
      this.requireAdapter();
      return mockRequestPasswordReset(email);
    });
  }
  getLoginDestination(next: string | null) {
    return next === "/home" || next?.startsWith("/home?") ? next : "/home";
  }
}
