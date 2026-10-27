// @vitest-environment node
import assert from "node:assert/strict";
import { beforeEach, test } from "vitest";
import { authConfig } from "./auth.config";
import { mockAuthUser, mockLoginCredentials } from "./auth-mocks";
import {
  getLoginDestination,
  getSession,
  requestPasswordReset,
  signIn,
  signInToDemo,
  signOut,
  subscribeToSession,
} from "./auth.service";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
function createBrowser() {
  return Object.assign(new EventTarget(), {
    localStorage: storage(),
    sessionStorage: storage(),
  });
}
let browser: ReturnType<typeof createBrowser>;
beforeEach(() => {
  browser = createBrowser();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser,
  });
  authConfig.useMocks = true;
  signOut();
});

test("sign-in uses a tab session by default and never stores the password", async () => {
  const session = await signIn(mockLoginCredentials);
  assert.deepEqual(session.user, mockAuthUser);
  assert.deepEqual(getSession(), session);
  assert.equal(browser.localStorage.getItem(authConfig.sessionKey), null);
  assert.ok(browser.sessionStorage.getItem(authConfig.sessionKey));
  assert.ok(
    !browser.sessionStorage
      .getItem(authConfig.sessionKey)!
      .includes(mockLoginCredentials.password),
  );
});

test("remember me persists the session; signing in without it clears the persistent session", async () => {
  await signInToDemo(true);
  assert.ok(browser.localStorage.getItem(authConfig.sessionKey));
  assert.equal(browser.sessionStorage.getItem(authConfig.sessionKey), null);
  await signInToDemo(false);
  assert.equal(browser.localStorage.getItem(authConfig.sessionKey), null);
  assert.ok(browser.sessionStorage.getItem(authConfig.sessionKey));
});

test("username login accepts surrounding whitespace and mixed case", async () => {
  const session = await signIn({
    ...mockLoginCredentials,
    identifier: ` ${mockAuthUser.username.toUpperCase()} `,
  });
  assert.equal(session.user.username, mockAuthUser.username);
});

test("incorrect credentials reject without creating a session", async () => {
  await assert.rejects(
    signIn({ ...mockLoginCredentials, password: "incorrect-password" }),
    /doesn’t match/,
  );
  assert.equal(getSession(), null);
});

test("sign-out clears all session stores and notifies subscribers", async () => {
  await signInToDemo(true);
  let changes = 0;
  const unsubscribe = subscribeToSession(() => {
    changes += 1;
  });
  signOut();
  assert.equal(getSession(), null);
  assert.equal(browser.localStorage.getItem(authConfig.sessionKey), null);
  assert.equal(browser.sessionStorage.getItem(authConfig.sessionKey), null);
  assert.equal(changes, 1);
  unsubscribe();
  signOut();
  assert.equal(changes, 1);
});

test("invalid or expired saved sessions are ignored", () => {
  browser.localStorage.setItem(authConfig.sessionKey, "invalid json");
  assert.equal(getSession(), null);
  browser.localStorage.setItem(
    authConfig.sessionKey,
    JSON.stringify({ user: mockAuthUser, expiresAt: Date.now() - 1 }),
  );
  assert.equal(getSession(), null);
  browser.localStorage.setItem(
    authConfig.sessionKey,
    JSON.stringify({ user: {}, expiresAt: Date.now() + 1000 }),
  );
  assert.equal(getSession(), null);
});

test("clearing persisted state does not resurrect an old session from memory", async () => {
  await signInToDemo(true);
  browser.localStorage.removeItem(authConfig.sessionKey);
  assert.equal(getSession(), null);
});

test("storage unavailable still allows an in-memory session and sign-out", async () => {
  Object.defineProperty(browser, "localStorage", {
    get() {
      throw new Error("Storage unavailable");
    },
  });
  Object.defineProperty(browser, "sessionStorage", {
    get() {
      throw new Error("Storage unavailable");
    },
  });
  await signInToDemo(true);
  assert.equal(getSession()?.user.username, mockAuthUser.username);
  signOut();
  assert.equal(getSession(), null);
});

test("password recovery validates email and clearly reports that no email was sent", async () => {
  await assert.rejects(requestPasswordReset("invalid"), /valid email/);
  assert.match(
    await requestPasswordReset(mockLoginCredentials.identifier),
    /no email was sent/,
  );
});

test("disabling mocks never falls back to a simulated successful login", async () => {
  authConfig.useMocks = false;
  await assert.rejects(signInToDemo(), /temporarily unavailable/);
  assert.equal(getSession(), null);
  assert.throws(
    () => requestPasswordReset(mockLoginCredentials.identifier),
    /temporarily unavailable/,
  );
});

test("return destinations are restricted to the home screen", () => {
  assert.equal(getLoginDestination("/home?tab=library"), "/home?tab=library");
  for (const path of [
    null,
    "https://example.com",
    "//example.com",
    "/login",
    "/home/other",
  ])
    assert.equal(getLoginDestination(path), "/home");
});

test("session reads are safe during server rendering", () => {
  Reflect.deleteProperty(globalThis, "window");
  assert.equal(getSession(), null);
});
