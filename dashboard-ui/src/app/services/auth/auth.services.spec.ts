import { firstValueFrom } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { HttpTestingController } from "@angular/common/http/testing";
import { expect, it, vi } from "vitest";
import { AuthService } from "./auth.services";
import { authConfig } from "../../config/auth.config";
import {
  mockAuthUser,
  mockLoginCredentials,
  mockSignupCredentials,
} from "../../mocks/auth-mocks";

it("keeps demo auth in memory and never writes auth browser storage", async () => {
  const auth = TestBed.inject(AuthService);
  const local = vi.spyOn(Storage.prototype, "setItem");
  const session = await firstValueFrom(auth.signIn(mockLoginCredentials));
  expect(session.user).toEqual(mockAuthUser);
  expect(auth.username()).toBe(mockAuthUser.username);
  expect(local).not.toHaveBeenCalled();
  await firstValueFrom(auth.signOut());
  expect(auth.session()).toBeNull();
});
it("removes obsolete auth storage without trusting its contents", () => {
  localStorage.setItem(
    "manga-session-v1",
    JSON.stringify({ user: mockAuthUser, expiresAt: Date.now() + 99999 }),
  );
  sessionStorage.setItem("manga-session-v1", "old");
  const auth = TestBed.inject(AuthService);
  expect(auth.getSession()).toBeNull();
  expect(localStorage.getItem("manga-session-v1")).toBeNull();
  expect(sessionStorage.getItem("manga-session-v1")).toBeNull();
});
it("normalizes demo credentials, rejects incorrect passwords and expires memory sessions", async () => {
  const auth = TestBed.inject(AuthService);
  await expect(
    firstValueFrom(auth.signIn({ ...mockLoginCredentials, password: "wrong" })),
  ).rejects.toThrow("doesn’t match");
  await firstValueFrom(
    auth.signIn({
      ...mockLoginCredentials,
      identifier: ` ${mockAuthUser.username.toUpperCase()} `,
    }),
  );
  vi.useFakeTimers();
  TestBed.tick();
  vi.advanceTimersByTime(authConfig.sessionDurationMs + 1);
  expect(auth.username()).toBeNull();
});
it("sends real login credentials with cookies and never returns or stores tokens", async () => {
  authConfig.useMocks = false;
  const auth = TestBed.inject(AuthService);
  const http = TestBed.inject(HttpTestingController);
  const result = firstValueFrom(auth.signIn(mockLoginCredentials, true));
  const req = http.expectOne("/api/auth/login");
  expect(req.request.withCredentials).toBe(true);
  expect(req.request.headers.get("X-Manga-Client")).toBe("web");
  expect(req.request.body).toEqual({ ...mockLoginCredentials, remember: true });
  req.flush({ user: mockAuthUser, expiresAt: Date.now() + 900000 });
  expect((await result).user).toEqual(mockAuthUser);
  expect(auth.username()).toBe(mockAuthUser.username);
  http.verify();
});
it("restores an expired access cookie through a single shared refresh request", async () => {
  authConfig.useMocks = false;
  const auth = TestBed.inject(AuthService);
  const http = TestBed.inject(HttpTestingController);
  const restored = firstValueFrom(auth.restore());
  http
    .expectOne("/api/auth/session")
    .flush({ detail: "expired" }, { status: 401, statusText: "Unauthorized" });
  const concurrent = firstValueFrom(auth.refresh());
  const request = http.expectOne("/api/auth/refresh");
  request.flush({ user: mockAuthUser, expiresAt: Date.now() + 900000 });
  expect((await restored)?.user).toEqual(mockAuthUser);
  expect((await concurrent).user).toEqual(mockAuthUser);
  http.verify();
});
it("restores guests without mock fallback and reports unavailable APIs", async () => {
  authConfig.useMocks = false;
  const auth = TestBed.inject(AuthService);
  const http = TestBed.inject(HttpTestingController);
  const guest = firstValueFrom(auth.restore());
  http
    .expectOne("/api/auth/session")
    .flush({}, { status: 401, statusText: "Unauthorized" });
  http
    .expectOne("/api/auth/refresh")
    .flush({}, { status: 401, statusText: "Unauthorized" });
  expect(await guest).toBeNull();
  expect(auth.error()).toBe("");
  await expect(firstValueFrom(auth.signInToDemo())).rejects.toThrow(
    "unavailable",
  );
  const failed = firstValueFrom(auth.restore());
  http
    .expectOne("/api/auth/session")
    .flush({}, { status: 503, statusText: "Unavailable" });
  expect(await failed).toBeNull();
  expect(auth.error()).toContain("Unable");
  http.verify();
});
it("waits for backend logout and preserves session when logout fails", async () => {
  const auth = TestBed.inject(AuthService);
  await firstValueFrom(auth.signInToDemo());
  authConfig.useMocks = false;
  const http = TestBed.inject(HttpTestingController);
  const failed = firstValueFrom(auth.signOut());
  http
    .expectOne("/api/auth/logout")
    .flush({}, { status: 503, statusText: "Unavailable" });
  await expect(failed).rejects.toThrow();
  expect(auth.username()).toBe(mockAuthUser.username);
  const success = firstValueFrom(auth.signOut());
  http
    .expectOne("/api/auth/logout")
    .flush(null, { status: 204, statusText: "No Content" });
  await success;
  expect(auth.session()).toBeNull();
});
it("routes signup, recovery and reset through the real API", async () => {
  authConfig.useMocks = false;
  const auth = TestBed.inject(AuthService);
  const http = TestBed.inject(HttpTestingController);
  const signup = firstValueFrom(auth.signUp(mockSignupCredentials));
  http.expectOne("/api/auth/signup").flush({ message: "Account created" });
  expect(await signup).toBe("Account created");
  const reset = firstValueFrom(
    auth.requestPasswordReset(mockSignupCredentials.email),
  );
  http
    .expectOne("/api/auth/password-reset")
    .flush({ message: "Check your email" });
  expect(await reset).toBe("Check your email");
  const change = firstValueFrom(
    auth.resetPassword("reset-secret", "new-password"),
  );
  const req = http.expectOne("/api/auth/reset-password");
  expect(req.request.body).toEqual({
    token: "reset-secret",
    password: "new-password",
  });
  req.flush({ message: "Password updated" });
  expect(await change).toBe("Password updated");
  http.verify();
});
it("validates mock signup/recovery and restricts redirect destinations", async () => {
  const auth = TestBed.inject(AuthService);
  expect(await firstValueFrom(auth.signUp(mockSignupCredentials))).toContain(
    "No account has been created",
  );
  await expect(
    firstValueFrom(
      auth.signUp({
        ...mockSignupCredentials,
        username: mockAuthUser.username,
      }),
    ),
  ).rejects.toThrow("already in use");
  await expect(
    firstValueFrom(auth.requestPasswordReset("invalid")),
  ).rejects.toThrow("valid email");
  expect(
    await firstValueFrom(
      auth.requestPasswordReset(mockSignupCredentials.email),
    ),
  ).toContain("no email was sent");
  expect(auth.getLoginDestination("/home?tab=library")).toBe(
    "/home?tab=library",
  );
  for (const path of [
    null,
    "https://evil.example",
    "//evil.example",
    "/login",
    "/home/other",
  ])
    expect(auth.getLoginDestination(path)).toBe("/home");
});

it("ignores a stale session restoration that completes after login and logout", async () => {
  authConfig.useMocks = false;
  const auth = TestBed.inject(AuthService);
  const http = TestBed.inject(HttpTestingController);
  const restored = firstValueFrom(auth.restore());
  const old = http.expectOne("/api/auth/session");
  const login = firstValueFrom(auth.signIn(mockLoginCredentials));
  const session = { user: mockAuthUser, expiresAt: Date.now() + 900000 };
  http.expectOne("/api/auth/login").flush(session);
  await login;
  const logout = firstValueFrom(auth.signOut());
  http
    .expectOne("/api/auth/logout")
    .flush(null, { status: 204, statusText: "No Content" });
  await logout;
  old.flush(session);
  await restored;
  expect(auth.session()).toBeNull();
  http.verify();
});
