import { apiConfig } from "../../config/api.config";
// Replace the mock adapter in auth.service.ts when the backend is available.
export const authConfig = {
  useMocks: apiConfig.useMocks && process.env.NEXT_PUBLIC_AUTH_MODE !== "backend",
  sessionKey: "manga-session-v1",
  sessionDurationMs: 7 * 24 * 60 * 60 * 1000,
};
