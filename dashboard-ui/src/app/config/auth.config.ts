import { InjectionToken } from "@angular/core";
import { environment } from "../../environments/environment";
export const authConfig = {
  useMocks: environment.authMode === "mock",
  sessionDurationMs: 7 * 24 * 60 * 60 * 1000,
};
export const AUTH_CONFIG = new InjectionToken<Readonly<typeof authConfig>>(
  "AUTH_CONFIG",
  { providedIn: "root", factory: () => authConfig },
);
