import { firstValueFrom } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { expect, it, vi } from "vitest";
import { AuthService } from "./auth.services";
import { BrowserStorage } from "./browser-storage.services";
import { authConfig } from "../config/auth.config";
import { apiConfig } from "../config/api.config";
import { mockAuthUser, mockLoginCredentials } from "../mocks/auth-mocks";

it("signs in through DI with readonly session and username signals", async () => {
  const auth = TestBed.inject(AuthService);
  const session = await firstValueFrom(auth.signIn(mockLoginCredentials));
  expect(session.user).toEqual(mockAuthUser);
  expect(auth.session()).toEqual(session);
  expect(auth.username()).toBe(mockAuthUser.username);
  expect(localStorage.getItem(authConfig.sessionKey)).toBeNull();
  expect(sessionStorage.getItem(authConfig.sessionKey)).not.toContain(
    mockLoginCredentials.password,
  );
});
it("remembers a session only when requested and restores it after creation", async () => {
  const auth = TestBed.inject(AuthService);
  await firstValueFrom(auth.signInToDemo(true));
  expect(localStorage.getItem(authConfig.sessionKey)).toBeTruthy();
  expect(sessionStorage.getItem(authConfig.sessionKey)).toBeNull();
  await firstValueFrom(auth.signInToDemo(false));
  expect(localStorage.getItem(authConfig.sessionKey)).toBeNull();
  expect(sessionStorage.getItem(authConfig.sessionKey)).toBeTruthy();
});
it("accepts normalized usernames and rejects incorrect credentials", async () => {
  const auth = TestBed.inject(AuthService);
  await firstValueFrom(
    auth.signIn({
      ...mockLoginCredentials,
      identifier: ` ${mockAuthUser.username.toUpperCase()} `,
    }),
  );
  expect(auth.username()).toBe(mockAuthUser.username);
  auth.signOut();
  await expect(
    firstValueFrom(
      auth.signIn({ ...mockLoginCredentials, password: "incorrect" }),
    ),
  ).rejects.toThrow("doesn’t match");
  expect(auth.session()).toBeNull();
});
it("clears storage and reactive session state on logout", async () => {
  const auth = TestBed.inject(AuthService);
  await firstValueFrom(auth.signInToDemo(true));
  auth.signOut();
  expect(auth.username()).toBeNull();
  expect(auth.session()).toBeNull();
  expect(localStorage.getItem(authConfig.sessionKey)).toBeNull();
  expect(sessionStorage.getItem(authConfig.sessionKey)).toBeNull();
});
it.each([
  "invalid json",
  JSON.stringify({ user: mockAuthUser, expiresAt: 0 }),
  JSON.stringify({ user: {}, expiresAt: Date.now() + 10000 }),
])("ignores invalid saved sessions: %s", (raw) => {
  localStorage.setItem(authConfig.sessionKey, raw);
  const auth = TestBed.inject(AuthService);
  expect(auth.getSession()).toBeNull();
});
it("restores persisted sessions and follows native cross-tab storage changes", async () => {
  const auth = TestBed.inject(AuthService);
  await firstValueFrom(auth.signInToDemo(true));
  const stored = localStorage.getItem(authConfig.sessionKey)!;
  localStorage.removeItem(authConfig.sessionKey);
  window.dispatchEvent(
    new StorageEvent("storage", { key: authConfig.sessionKey }),
  );
  expect(auth.username()).toBeNull();
  localStorage.setItem(authConfig.sessionKey, stored);
  window.dispatchEvent(
    new StorageEvent("storage", { key: authConfig.sessionKey }),
  );
  expect(auth.username()).toBe(mockAuthUser.username);
});
it("keeps an in-memory session when browser storage cannot write", async () => {
  const storage = TestBed.inject(BrowserStorage);
  vi.spyOn(storage, "write").mockReturnValue(false);
  const auth = TestBed.inject(AuthService);
  await firstValueFrom(auth.signInToDemo());
  expect(auth.getSession()?.user.username).toBe(mockAuthUser.username);
  auth.signOut();
  expect(auth.session()).toBeNull();
});
it("expires reactive session state without a custom session event", async () => {
  const auth = TestBed.inject(AuthService);
  await firstValueFrom(auth.signInToDemo());
  vi.useFakeTimers();
  TestBed.tick();
  vi.advanceTimersByTime(authConfig.sessionDurationMs + 1);
  expect(auth.username()).toBeNull();
});
it("validates mock recovery and reports that no email was sent", async () => {
  const auth = TestBed.inject(AuthService);
  await expect(
    firstValueFrom(auth.requestPasswordReset("invalid")),
  ).rejects.toThrow("valid email");
  expect(
    await firstValueFrom(
      auth.requestPasswordReset(mockLoginCredentials.identifier),
    ),
  ).toContain("no email was sent");
});
it("does not fall back to mock sign-in when the adapter is disabled", async () => {
  const auth = TestBed.inject(AuthService);
  authConfig.useMocks = false;
  await expect(firstValueFrom(auth.signInToDemo())).rejects.toThrow(
    "temporarily unavailable",
  );
  await expect(
    firstValueFrom(auth.requestPasswordReset(mockLoginCredentials.identifier)),
  ).rejects.toThrow("temporarily unavailable");
  expect(auth.getSession()).toBeNull();
  authConfig.useMocks = true;
  apiConfig.useMocks = false;
  await expect(firstValueFrom(auth.signInToDemo())).rejects.toThrow(
    "temporarily unavailable",
  );
});
it("restricts return destinations to home routes", () => {
  const auth = TestBed.inject(AuthService);
  expect(auth.getLoginDestination("/home?tab=library")).toBe(
    "/home?tab=library",
  );
  for (const path of [
    null,
    "https://example.com",
    "//example.com",
    "/login",
    "/home/other",
  ])
    expect(auth.getLoginDestination(path)).toBe("/home");
});
it("reads sessions safely outside a browser platform", () => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: "server" }],
  });
  expect(TestBed.inject(AuthService).getSession()).toBeNull();
});
