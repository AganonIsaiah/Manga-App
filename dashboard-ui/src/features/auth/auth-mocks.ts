import type { AuthUser, LoginCredentials } from "./auth.types";

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

export async function mockSignIn(
  credentials: LoginCredentials,
): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, mockAuthDelayMs));
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
}

export async function mockRequestPasswordReset(email: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, mockAuthDelayMs));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw new Error("Enter a valid email address.");
  return "This is a demo, so no email was sent. Use the demo account to sign in.";
}
