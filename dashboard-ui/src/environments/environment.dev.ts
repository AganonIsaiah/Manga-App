export const environment: {
  apiBaseUrl: string;
  authMode: "mock" | "backend";
} = {
  // Call the local FastAPI server directly during development.
  apiBaseUrl: "http://localhost:8000/api",
  authMode: "backend",
};
