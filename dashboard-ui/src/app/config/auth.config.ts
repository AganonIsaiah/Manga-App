import { InjectionToken } from "@angular/core";
import { environment } from "../../environments/environment";
import { apiConfig } from "./api.config";
// Replace the mock adapter in auth.services.ts when the backend is available.
export const authConfig = {
  useMocks: apiConfig.useMocks && environment.authMode !== "backend",
  sessionKey: "manga-session-v1",
  sessionDurationMs: 7 * 24 * 60 * 60 * 1000,
};

export const AUTH_CONFIG = new InjectionToken<Readonly<typeof authConfig>>(
  "AUTH_CONFIG",
  { providedIn: "root", factory: () => authConfig },
);
