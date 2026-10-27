import { Observable, map, timer } from "rxjs";
import type { AuthUser, LoginCredentials } from "../models/auth.model";

export const mockLoginCredentials: LoginCredentials = {
  identifier: "reader@manga.demo",
  password: "manga-demo",
};
export const mockAuthUser: AuthUser = {
  id: "reader-001",
  name: "Isaiah",
  username: "aganon33",
};
export const mockAuthDelayMs = 450;

export function mockSignIn(
  credentials: LoginCredentials,
): Observable<AuthUser> {
  return timer(mockAuthDelayMs).pipe(
    map(() => {
      const identifier = credentials.identifier.trim().toLowerCase();
      if (
        ![mockLoginCredentials.identifier, mockAuthUser.username].includes(
          identifier,
        ) ||
        credentials.password !== mockLoginCredentials.password
      ) {
        throw new Error(
          "That email, username, or password doesn’t match. Please try again.",
        );
      }
      return { ...mockAuthUser };
    }),
  );
}

export function mockRequestPasswordReset(email: string): Observable<string> {
  return timer(mockAuthDelayMs).pipe(
    map(() => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        throw new Error("Enter a valid email address.");
      return "This is a demo, so no email was sent. Use the demo account to sign in.";
    }),
  );
}
