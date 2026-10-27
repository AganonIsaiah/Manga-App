import { TestBed } from "@angular/core/testing";
import { HttpTestingController } from "@angular/common/http/testing";
import { firstValueFrom } from "rxjs";
import { expect, it } from "vitest";
import { LocationsService } from "./locations.services";

it("loads city assets once and scopes suggestions to the selected country", async () => {
  const service = TestBed.inject(LocationsService);
  const http = TestBed.inject(HttpTestingController);
  const canada = firstValueFrom(service.getCities("CA"));
  const request = http.expectOne("/locations/cities.json");
  expect(request.request.withCredentials).toBe(false);
  expect(request.request.headers.has("X-Manga-Client")).toBe(false);
  request.flush({ CA: ["Toronto", "Montréal"], US: ["Boston"] });
  expect(await canada).toEqual([
    { value: "Toronto", label: "Toronto" },
    { value: "Montréal", label: "Montréal" },
  ]);
  expect(await firstValueFrom(service.getCities("US"))).toEqual([
    { value: "Boston", label: "Boston" },
  ]);
  expect(await firstValueFrom(service.getCities("AQ"))).toEqual([]);
  http.verify();
});
