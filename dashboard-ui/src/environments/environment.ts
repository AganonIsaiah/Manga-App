// Configure the API handoff here; no Node/Next runtime globals are needed in the browser.
export const environment: 
  { apiBaseUrl: string; authMode: "mock" | "backend" } =
  { apiBaseUrl: "/api", authMode: "mock" };
