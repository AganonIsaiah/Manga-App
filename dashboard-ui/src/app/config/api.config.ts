import { InjectionToken } from "@angular/core";
import { environment } from "../../environments/environment";
// Keep mocks enabled until the backend contracts and endpoints are ready.
export const USE_MOCKS = true;
export const apiConfig = {
  useMocks: USE_MOCKS,
  baseUrl: environment.apiBaseUrl,
};

export const API_CONFIG = new InjectionToken<Readonly<typeof apiConfig>>(
  "API_CONFIG",
  { providedIn: "root", factory: () => apiConfig },
);
