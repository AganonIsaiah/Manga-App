import { firstValueFrom } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { HttpTestingController } from "@angular/common/http/testing";
import { afterEach, expect, it } from "vitest";
import { API_CONFIG } from "../config/api.config";
import { ApiClient } from "./api-client.services";
import { ApiError } from "../models/api-client.model";

afterEach(() => {
  TestBed.inject(HttpTestingController).verify();
});
it("requests typed JSON with credentials and the correct headers", async () => {
  const api = TestBed.inject(ApiClient);
  const result = firstValueFrom(api.requestJson<{ ok: boolean }>("/health"));
  const request = TestBed.inject(HttpTestingController).expectOne(
    "/api/health",
  );
  expect(request.request.method).toBe("GET");
  expect(request.request.withCredentials).toBe(true);
  expect(request.request.headers.get("Accept")).toBe("application/json");
  expect(request.request.headers.has("Content-Type")).toBe(false);
  request.flush({ ok: true });
  expect(await result).toEqual({ ok: true });
});
it("maps network failures to the UI error contract", async () => {
  const result = firstValueFrom(
    TestBed.inject(ApiClient).requestJson("/offline"),
  );
  const rejected = expect(result).rejects.toMatchObject({
    name: "ApiError",
    status: 0,
  });
  TestBed.inject(HttpTestingController)
    .expectOne("/api/offline")
    .error(new ProgressEvent("error"));
  await rejected;
});
it("maps unsuccessful responses without substituting fixtures", async () => {
  const result = firstValueFrom(
    TestBed.inject(ApiClient).requestJson("/missing"),
  );
  const rejected = expect(result).rejects.toBeInstanceOf(ApiError);
  TestBed.inject(HttpTestingController)
    .expectOne("/api/missing")
    .flush(null, { status: 404, statusText: "Not found" });
  await rejected;
});

it("uses an injected API configuration without a module-global client", async () => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: API_CONFIG,
        useValue: { baseUrl: "/injected/", useMocks: false },
      },
    ],
  });
  const result = firstValueFrom(
    TestBed.inject(ApiClient).requestJson("/health"),
  );
  TestBed.inject(HttpTestingController)
    .expectOne("/injected/health")
    .flush({ ok: true });
  expect(await result).toEqual({ ok: true });
});

it("starts HTTP work only on subscription and cancels it on unsubscribe", () => {
  const http = TestBed.inject(HttpTestingController);
  const request$ = TestBed.inject(ApiClient).requestJson("/pending");
  http.expectNone("/api/pending");
  const subscription = request$.subscribe();
  const request = http.expectOne("/api/pending");
  expect(request.cancelled).toBe(false);
  subscription.unsubscribe();
  expect(request.cancelled).toBe(true);
});
