export type LoginCredentials = { identifier: string; password: string };
export type AuthUser = {
  id: string;
  name: string;
  username: string;
  created_at?: string;
  country_code?: string | null;
  city?: string | null;
  avatar_url?: string | null;
};
export type AuthSession = {
  user: AuthUser;
  expiresAt: number;
};

export type SignupCredentials = {
  name: string;
  username: string;
  created_at?: string;
  country_code?: string;
  city?: string;
  email: string;
  password: string;
};
