import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, catchError, defer, throwError } from "rxjs";
import { API_CONFIG } from "../../config/api.config";
import {
  ApiError,
  type ApiRequestOptions,
} from "../../models/api-client.model";

@Injectable({ providedIn: "root" })
export class ApiClient {
  private readonly config = inject(API_CONFIG);
  private readonly http = inject(HttpClient);
  assetJson<T>(path: string): Observable<T> {
    return this.http.get<T>(path);
  }
  requestJson<T>(path: string, options: ApiRequestOptions = {}): Observable<T> {
    return defer(() =>
      this.http.request<T>(
        options.method ?? "GET",
        `${this.config.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
        {
          body: options.body,
          withCredentials: true,
          headers:
            options.body === undefined || options.body instanceof Blob
              ? { Accept: "application/json", "X-Manga-Client": "web" }
              : {
                  Accept: "application/json",
                  "X-Manga-Client": "web",
                  "Content-Type": "application/json",
                },
        },
      ),
    ).pipe(
      catchError((error: unknown) =>
        throwError(() =>
          error instanceof HttpErrorResponse
            ? new ApiError(
                typeof error.error?.detail === "string"
                  ? error.error.detail
                  : `Unable to load or save data. Please try again. (${error.status})`,
                error.status,
              )
            : error,
        ),
      ),
    );
  }
}
