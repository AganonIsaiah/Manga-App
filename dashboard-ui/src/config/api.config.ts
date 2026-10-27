// Keep mocks enabled until the backend contracts and endpoints are ready.
export const USE_MOCKS = true;
export const apiConfig = {
  useMocks: USE_MOCKS,
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
};
