import { apiConfig } from "../../config/api.config";
import { authConfig } from "./auth.config";
import {
  mockLoginCredentials,
  mockRequestPasswordReset,
  mockSignIn,
} from "./auth-mocks";
import type { AuthSession, LoginCredentials } from "./auth.types";

const sessionChangedEvent = "manga-session-changed";
let memorySession: AuthSession | null = null;

function clearStoredSessions() {
  if (typeof window === "undefined") return;
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      window[storage].removeItem(authConfig.sessionKey);
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }
}
function notify() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(sessionChangedEvent));
}
function requireAdapter() {
  if (!apiConfig.useMocks || !authConfig.useMocks)
    throw new Error(
      "Sign-in is temporarily unavailable. Please try again later.",
    );
}
export function getSession(): AuthSession | null {
  if (
    typeof window === "undefined" ||
    !apiConfig.useMocks ||
    !authConfig.useMocks
  )
    return null;
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      const value: unknown = JSON.parse(
        window[storage].getItem(authConfig.sessionKey) || "null",
      );
      if (isSession(value)) return value;
    } catch {
      /* Ignore unavailable storage or invalid saved sessions. */
    }
  }
  return isSession(memorySession) ? memorySession : null;
}
function isSession(value: unknown): value is AuthSession {
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
export async function signIn(
  credentials: LoginCredentials,
  remember = false,
): Promise<AuthSession> {
  requireAdapter();
  const user = await mockSignIn(credentials);
  const session = {
    user,
    expiresAt: Date.now() + authConfig.sessionDurationMs,
  };
  clearStoredSessions();
  memorySession = null;
  try {
    window[remember ? "localStorage" : "sessionStorage"].setItem(
      authConfig.sessionKey,
      JSON.stringify(session),
    );
  } catch {
    memorySession = session;
  }
  notify();
  return session;
}
export function signInToDemo(remember = false) {
  return signIn(mockLoginCredentials, remember);
}
export function signOut() {
  memorySession = null;
  clearStoredSessions();
  notify();
}
export function requestPasswordReset(email: string) {
  requireAdapter();
  return mockRequestPasswordReset(email);
}
export function subscribeToSession(callback: () => void) {
  window.addEventListener(sessionChangedEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(sessionChangedEvent, callback);
    window.removeEventListener("storage", callback);
  };
}
export function getSessionUsername() {
  return getSession()?.user.username ?? null;
}
export function getLoginDestination(next: string | null) {
  return next === "/home" || next?.startsWith("/home?") ? next : "/home";
}
