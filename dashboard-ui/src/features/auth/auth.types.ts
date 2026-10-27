export type LoginCredentials = { identifier: string; password: string };
export type AuthUser = { id: string; name: string; username: string };
export type AuthSession = { user: AuthUser; expiresAt: number };
