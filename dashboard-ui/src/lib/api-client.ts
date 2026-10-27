import { apiConfig } from "../config/api.config";
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(
    `${apiConfig.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
    { ...options, headers, credentials: "include" },
  );
  if (!response.ok)
    throw new ApiError(
      `Unable to load or save data. Please try again. (${response.status})`,
      response.status,
    );
  return response.json() as Promise<T>;
}
