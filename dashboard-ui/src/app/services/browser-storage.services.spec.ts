import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { expect, it, vi } from "vitest";
import { BrowserStorage } from "./browser-storage.services";

it("reads and writes scoped browser storage through the injected document", () => {
  const storage = TestBed.inject(BrowserStorage);
  expect(storage.write("local", "value")).toBe(true);
  expect(storage.read("local")).toBe("value");
  expect(storage.read("local", "sessionStorage")).toBeNull();
  storage.write("tab", "session", "sessionStorage");
  expect(storage.read("tab", "sessionStorage")).toBe("session");
  storage.remove("local");
  storage.remove("tab", "sessionStorage");
  expect(storage.read("local")).toBeNull();
  expect(storage.read("tab", "sessionStorage")).toBeNull();
});
it("handles blocked storage without breaking the application", () => {
  const storage = TestBed.inject(BrowserStorage);
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  expect(storage.read("key")).toBeNull();
  expect(storage.write("key", "value")).toBe(false);
  expect(() => storage.remove("key")).not.toThrow();
});
it("does not access browser storage when rendered on the server", () => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: "server" }],
  });
  const storage = TestBed.inject(BrowserStorage);
  expect(storage.window).toBeNull();
  expect(storage.read("key")).toBeNull();
  expect(storage.write("key", "value")).toBe(false);
  expect(() => storage.remove("key")).not.toThrow();
});
