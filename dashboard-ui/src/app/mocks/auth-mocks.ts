import { Observable, map, timer } from "rxjs";
import type { AuthUser, LoginCredentials, SignupCredentials } from "../models/auth.model";

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

export const mockSignupCredentials: SignupCredentials = {
  name: "New Reader", username: "new_reader", email: "new@example.com", password: "manga-reader-demo",
};
export function mockSignUp(credentials: SignupCredentials): Observable<string> {
  return timer(mockAuthDelayMs).pipe(map(() => {
    if (!credentials.name.trim() || !/^[a-zA-Z0-9_]{3,24}$/.test(credentials.username.trim()) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email.trim()) || credentials.password.length < 12)
      throw new Error("Check your details and use a password with at least 12 characters.");
    if (credentials.username.trim().toLowerCase() === mockAuthUser.username || credentials.email.trim().toLowerCase() === mockLoginCredentials.identifier)
      throw new Error("That email or username is already in use.");
    return "You're all set for the preview. No account has been created yet. Use the demo account on the sign-in page to explore.";
  }));
}
