export const environment: {
  apiBaseUrl: string;
  authMode: "mock" | "backend";
} = {
  // Backend deployment pending. Add a production /api reverse proxy when deployed,
  // or replace this with the deployed HTTPS backend URL including /api.
  apiBaseUrl: "/api",
  authMode: "backend",
};
