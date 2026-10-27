import { pendingRequest } from "../../../tests/mock/request-mocks";
import { of, throwError } from "rxjs";
import { firstValueFrom } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthService } from "./auth.services";
import { HomeStore } from "./home-store.services";
import { HomeApi } from "./home.services";
import {
  mockInitialLibraryState,
  mockProfileDetails,
  catalog,
  readers,
} from "../mocks/home-mocks";

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
});
async function ready(signedIn = true) {
  const auth = TestBed.inject(AuthService);
  if (signedIn) await firstValueFrom(auth.signInToDemo());
  const store = TestBed.inject(HomeStore);
  TestBed.tick();
  await expect.poll(() => store.ready()).toBe(true);
  return store;
}

it("loads home without creating a guest account or issuing a library request", async () => {
  const api = TestBed.inject(HomeApi);
  const get = vi.spyOn(api, "getUserProfile");
  const store = await ready(false);
  expect(store.catalog()).toEqual(catalog);
  expect(store.account()).toBeNull();
  expect(store.state().bookmarks).toEqual([]);
  expect(get).not.toHaveBeenCalled();
});
it("redirects guest mutations to login and preserves the requested route", async () => {
  const store = await ready(false);
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, "navigate").mockResolvedValue(true);
  expect(store.toggleBookmark(catalog[0].id)).toBe(false);
  expect(store.toggleFollow(readers[0].username)).toBe(false);
  expect(store.read(catalog[0].id)).toBe(false);
  expect(navigate).toHaveBeenCalledWith(["/login"], {
    queryParams: { next: "/" },
  });
  expect(store.state().bookmarks).toEqual([]);
});
it("bounds reading chapters and replaces reviews by manga ID", async () => {
  const store = await ready();
  store.read(catalog[0].id, -4);
  expect(store.state().progress[catalog[0].id]).toBe(1);
  store.read(catalog[0].id, 100000);
  expect(store.state().progress[catalog[0].id]).toBe(
    Number(catalog[0].recent_chapter.replace(/\D/g, "")),
  );
  const review = {
    id: catalog[0].id,
    rating: 5,
    text: "Review",
    date: "2026-10-26",
  };
  store.saveReview(review);
  store.saveReview({ ...review, text: "Edited" });
  expect(store.state().reviews.filter((r) => r.id === review.id)).toEqual([
    { ...review, text: "Edited" },
  ]);
  store.deleteReview(review.id);
  expect(store.state().reviews.some((r) => r.id === review.id)).toBe(false);
});
it("serializes saves so slower older changes cannot overwrite newer state", async () => {
  const store = await ready();
  const api = TestBed.inject(HomeApi);
  const pending = pendingRequest<typeof mockInitialLibraryState>();
  const save = vi
    .spyOn(api, "saveUserLibrary")
    .mockReturnValueOnce(pending.stream)
    .mockReturnValue(of(mockInitialLibraryState));
  store.toggleBookmark(catalog[0].id);
  await expect.poll(() => save.mock.calls.length).toBe(1);
  const first = save.mock.calls[0][1];
  store.toggleBookmark(catalog[1].id);
  await Promise.resolve();
  expect(save).toHaveBeenCalledTimes(1);
  pending.resolve(first);
  await expect.poll(() => save.mock.calls.length).toBe(2);
  expect(save.mock.calls[1][1]).toEqual(store.state());
});
it("keeps visible edits on a failed save and retries the latest snapshot", async () => {
  const store = await ready();
  const api = TestBed.inject(HomeApi);
  const save = vi
    .spyOn(api, "saveUserLibrary")
    .mockReturnValueOnce(throwError(() => new Error("Save offline")))
    .mockReturnValue(of(mockInitialLibraryState));
  store.toggleBookmark(catalog[0].id);
  const state = store.state();
  await expect.poll(() => store.saveError()?.message).toBe("Save offline");
  expect(store.state()).toEqual(state);
  store.retrySave();
  await expect.poll(() => store.saveError()).toBeNull();
  expect(save).toHaveBeenLastCalledWith(mockProfileDetails.username, state);
});
it("does not restore stale account data after sign-out", async () => {
  const store = await ready();
  const api = TestBed.inject(HomeApi);
  const account = store.account()!;
  const pending = pendingRequest<typeof account>();
  vi.spyOn(api, "getUserProfile").mockReturnValueOnce(pending.stream);
  store.loadAccount(mockProfileDetails.username);
  store.auth.signOut();
  TestBed.tick();
  pending.resolve(account);
  expect(pending.observed()).toBe(false);
  expect(store.account()).toBeNull();
  expect(store.state().following).toEqual([]);
});
it("reports account loading errors and recovers on retry", async () => {
  const api = TestBed.inject(HomeApi);
  vi.spyOn(api, "getUserProfile").mockReturnValueOnce(
    throwError(() => new Error("Library offline")),
  );
  await firstValueFrom(TestBed.inject(AuthService).signInToDemo());
  const store = TestBed.inject(HomeStore);
  TestBed.tick();
  await expect
    .poll(() => store.accountError()?.message)
    .toBe("Library offline");
  expect(store.ready()).toBe(false);
  await store.loadAccount(mockProfileDetails.username);
  expect(store.ready()).toBe(true);
  expect(store.accountError()).toBeNull();
});

it("does not reload the account when only the catalog is refreshed", async () => {
  const store = await ready();
  const api = TestBed.inject(HomeApi);
  const get = vi.spyOn(api, "getUserProfile");
  await store.loadHome();
  TestBed.tick();
  expect(get).not.toHaveBeenCalled();
  expect(store.ready()).toBe(true);
});
it("exposes readonly data, account, and library state to components", async () => {
  const store = await ready();
  expect("set" in store.data).toBe(false);
  expect("set" in store.account).toBe(false);
  expect("set" in store.state).toBe(false);
});
