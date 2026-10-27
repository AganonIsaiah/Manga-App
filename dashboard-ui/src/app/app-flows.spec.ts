import { pendingRequest } from "../../tests/mock/request-mocks";
import { of, throwError } from "rxjs";
import { firstValueFrom } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Home } from "./features/home/home";
import { Login } from "./features/login/login";
import { HomeStore } from "./services/home-store/home-store.services";
import { HomeApi } from "./services/home/home.services";
import { AuthService } from "./services/auth/auth.services";
import { mockLoginCredentials } from "./mocks/auth-mocks";
import {
  catalog,
  mockFavouritePanels,
  mockProfileDetails,
  readers,
} from "./mocks/home-mocks";

let harness: RouterTestingHarness;
const root = () => harness.fixture.nativeElement as HTMLElement;
const button = (name: string) =>
  Array.from(root().querySelectorAll("button")).find(
    (b) =>
      b.textContent?.trim() === name || b.getAttribute("aria-label") === name,
  )!;
async function stable() {
  harness.detectChanges();
  await harness.fixture.whenStable();
  harness.detectChanges();
}
async function open(url: string) {
  harness = await RouterTestingHarness.create(url);
  await stable();
}
async function click(name: string) {
  expect(button(name), name).toBeTruthy();
  button(name).click();
  const component = harness.routeDebugElement?.componentInstance;
  if (component instanceof Login)
    await expect.poll(() => component.pending()).toBe(false);
  await stable();
}
function input(selector: string, value: string) {
  const el = root().querySelector<HTMLInputElement | HTMLTextAreaElement>(
    selector,
  )!;
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: "home", component: Home },
        { path: "login", component: Login },
      ]),
    ],
  });
});

describe("Angular login", () => {
  it("keeps guests separate from the demo account and restores the destination", async () => {
    await open("/login?next=%2Fhome%3Ftab%3Dlibrary");
    expect(root().textContent).toContain("Welcome back");
    await click("Use demo account");
    expect(TestBed.inject(Router).url).toBe("/home?tab=library");
    expect(root().textContent).toContain(mockProfileDetails.name);
    await click("Sign out");
    expect(TestBed.inject(Router).url).toBe("/login");
    expect(TestBed.inject(HomeStore).account()).toBeNull();
  });
  it("validates fields, toggles password visibility, and displays authentication errors", async () => {
    await open("/login");
    const component = harness.routeDebugElement!.componentInstance as Login;
    component.submit();
    await expect.poll(() => component.pending()).toBe(false);
    expect(component.form.invalid).toBe(true);
    expect(component.form.touched).toBe(true);
    await click("Show password");
    expect(root().querySelector("#login-password")?.getAttribute("type")).toBe(
      "text",
    );
    input("#login-identifier", mockLoginCredentials.identifier);
    input("#login-password", "incorrect");
    component.submit();
    await expect.poll(() => component.pending()).toBe(false);
    await stable();
    expect(root().querySelector('[role="alert"]')?.textContent).toContain(
      "doesn’t match",
    );
  });
  it("signs in with the service credentials without storing auth in browser storage", async () => {
    await open("/login");
    const component = harness.routeDebugElement!.componentInstance as Login;
    component.form.setValue({ ...mockLoginCredentials, remember: true });
    component.submit();
    await expect.poll(() => component.pending()).toBe(false);
    await stable();
    expect(TestBed.inject(HomeStore).auth.username()).toBe(
      mockProfileDetails.username,
    );
    expect(localStorage.getItem("manga-session-v1")).toBeNull();
    expect(sessionStorage.getItem("manga-session-v1")).toBeNull();
  });
  it("uses an honest mock password recovery message and supports returning to login", async () => {
    await open("/login");
    await click("Forgot password?");
    const component = harness.routeDebugElement!.componentInstance as Login;
    component.recovery.controls.email.setValue(mockLoginCredentials.identifier);
    component.submit();
    await expect.poll(() => component.pending()).toBe(false);
    await stable();
    expect(root().textContent).toContain("no email was sent");
    await click("Back to sign in");
    expect(root().textContent).toContain("Welcome back");
  });
});

describe("Angular home and search", () => {
  it("gates the private library without displaying a default profile", async () => {
    await open("/home?tab=library");
    expect(root().textContent).toContain("Sign in to see your readings");
    expect(root().textContent).not.toContain(mockProfileDetails.name);
    expect(root().querySelector("nav a")?.textContent).toContain("Sign in");
  });
  it("shows recommendation details, keeps rapid arrows ordered, and settles after resize", async () => {
    await open("/home");
    await click(`Show details for ${catalog[0].title}`);
    expect(root().textContent).toContain(
      `Story: ${catalog[0].authors.join(", ")}`,
    );
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollTo");
    await click("Next recommendation");
    expect(scroll).toHaveBeenLastCalledWith({ top: 640, behavior: "smooth" });
    await click("Next recommendation");
    expect(scroll).toHaveBeenLastCalledWith({ top: 1280, behavior: "smooth" });
    await click("Previous recommendation");
    const feed = root().querySelector("[data-recommendation-feed]")!;
    Object.defineProperties(feed, {
      clientHeight: { configurable: true, value: 704 },
      scrollTop: { configurable: true, value: 640 },
    });
    feed.dispatchEvent(new Event("scrollend"));
    expect(scroll).toHaveBeenLastCalledWith({ top: 704, behavior: "instant" });
  });
  it("extends the feed near its end without changing the current scroll position", async () => {
    await open("/home");
    const feed = root().querySelector<HTMLElement>(
      "[data-recommendation-feed]",
    )!;
    const before = feed.firstElementChild!.childElementCount;
    Object.defineProperties(feed, {
      scrollTop: { configurable: true, value: 640 * 7 },
      scrollHeight: { configurable: true, value: 640 * 8 },
      clientHeight: { configurable: true, value: 640 },
    });
    feed.dispatchEvent(new Event("scroll"));
    await stable();
    expect(feed.firstElementChild!.childElementCount).toBeGreaterThan(before);
    expect(feed.scrollTop).toBe(640 * 7);
  });
  it("toggles search suggestions and clears them without submitting", async () => {
    await open("/home?tab=search");
    const pill = root().querySelector<HTMLButtonElement>("ul button")!;
    pill.click();
    await stable();
    expect(pill.getAttribute("aria-pressed")).toBe("true");
    expect(root().querySelector<HTMLInputElement>("input")?.value).toBe(
      pill.textContent?.trim(),
    );
    await click("Clear search");
    expect(root().querySelector<HTMLInputElement>("input")?.value).toBe("");
  });
  it("renders manga matches and empty filtered results through the service", async () => {
    await open("/home?tab=search&q=fantasy");
    expect(root().querySelectorAll(".manga-card").length).toBeGreaterThan(0);
    const select = root().querySelector<HTMLSelectElement>(
      '[aria-label="Filter by genre"]',
    )!;
    select.value = "Comedy";
    select.dispatchEvent(new Event("change"));
    await stable();
    expect(root().textContent).toContain("No stories found");
    await click("Reset filters");
    expect(root().querySelectorAll(".manga-card").length).toBeGreaterThan(0);
  });
  it("finds readers and links to public profiles", async () => {
    await open(`/home?tab=search&q=@${readers[1].username}`);
    expect(root().textContent).toContain(readers[1].name);
    expect(
      root().querySelector(".person-card a")?.getAttribute("href"),
    ).toContain(readers[1].username);
  });
  it("renders public profiles for guests and handles missing readers", async () => {
    await open(`/home?tab=library&user=${readers[1].username}`);
    expect(root().textContent).toContain(readers[1].name);
    expect(root().textContent).not.toContain(mockProfileDetails.name);
    await harness.navigateByUrl("/home?tab=library&user=missing-reader");
    await stable();
    expect(root().textContent).toContain("Reader not found");
  });
  it("shows service errors with a working retry", async () => {
    const api = TestBed.inject(HomeApi);
    vi.spyOn(api, "getHomeData").mockReturnValueOnce(
      throwError(() => new Error("Offline")),
    );
    await open("/home");
    expect(root().textContent).toContain("Offline");
    await click("Try again");
    await expect
      .poll(() => root().querySelector("[data-recommendation-feed]"))
      .toBeTruthy();
  });
});

describe("Angular library", () => {
  beforeEach(async () => {
    await firstValueFrom(TestBed.inject(AuthService).signInToDemo());
  });
  it("opens favourite panels and connection dialogs", async () => {
    await open("/home?tab=library");
    await click(`View favourite panel from ${mockFavouritePanels[0].title}`);
    expect(root().querySelector("dialog")?.getAttribute("aria-label")).toBe(
      "Favourite panel",
    );
    await click("Close panel");
    const followers = Array.from(
      root().querySelectorAll<HTMLButtonElement>(".stat"),
    ).find((b) => b.textContent?.includes("Followers"))!;
    followers.click();
    await stable();
    expect(root().querySelector("dialog")?.getAttribute("aria-label")).toBe(
      "followers",
    );
    await click("Close connections");
    expect(root().querySelector("dialog")).toBeNull();
  });
  it("updates reading chapters and filters completed stories", async () => {
    await open("/home?tab=library");
    root()
      .querySelectorAll<HTMLButtonElement>(".library-tabs button")[1]
      .click();
    await stable();
    const el = root().querySelector<HTMLInputElement>(".chapter-input")!;
    const max = Number(el.max);
    input(".chapter-input", String(max));
    await stable();
    expect(Number(root().querySelector("progress")?.value)).toBe(max);
    await click("Completed");
    expect(root().querySelectorAll(".manga-card").length).toBeGreaterThan(0);
  });
  it("removes bookmarks, persists changes, and supports review creation, editing and deletion", async () => {
    await open("/home?tab=library");
    root()
      .querySelectorAll<HTMLButtonElement>(".library-tabs button")[2]
      .click();
    await stable();
    const before = root().querySelectorAll(".manga-card").length;
    const remove = root().querySelector<HTMLButtonElement>(
      '[aria-label^="Remove bookmark for"]',
    )!;
    remove.click();
    await stable();
    expect(root().querySelectorAll(".manga-card")).toHaveLength(before - 1);
    root()
      .querySelectorAll<HTMLButtonElement>(".library-tabs button")[3]
      .click();
    await stable();
    await click("Write a review");
    input("textarea", "A story worth revisiting.");
    await stable();
    await click("Save review");
    expect(root().textContent).toContain("A story worth revisiting.");
    await click("Edit");
    input("textarea", "Changed my mind.");
    await stable();
    await click("Save review");
    expect(root().textContent).toContain("Changed my mind.");
    await click("Delete");
    expect(root().textContent).not.toContain("Changed my mind.");
  });
  it("follows public readers and updates the follow button", async () => {
    await open(`/home?tab=library&user=${readers[1].username}`);
    const store = TestBed.inject(HomeStore);
    if (store.state().following.includes(readers[1].username))
      await click("Following");
    await click("Follow");
    expect(store.state().following).toContain(readers[1].username);
    await click("Following");
    expect(store.state().following).not.toContain(readers[1].username);
  });
});

it("routes a guest bookmark action through login without changing library state", async () => {
  await open("/home?tab=search&q=fantasy");
  root().querySelector<HTMLButtonElement>('[aria-label^="Bookmark "]')!.click();
  await stable();
  expect(TestBed.inject(Router).url).toContain("/login?next=");
  expect(TestBed.inject(HomeStore).state().bookmarks).toEqual([]);
});
it("opens the reader preview, updates its chapter, and closes with native cancel", async () => {
  await firstValueFrom(TestBed.inject(AuthService).signInToDemo());
  await open("/home");
  const action = root().querySelector<HTMLButtonElement>(
    ".home-view-card .action-primary",
  )!;
  action.click();
  await stable();
  expect(root().querySelector("dialog")?.textContent).toContain(
    "Reading preview",
  );
  const before = TestBed.inject(HomeStore).state().progress[catalog[0].id];
  await click("Next chapter");
  expect(TestBed.inject(HomeStore).state().progress[catalog[0].id]).toBe(
    before + 1,
  );
  await click("Previous chapter");
  expect(TestBed.inject(HomeStore).state().progress[catalog[0].id]).toBe(
    before,
  );
  root()
    .querySelector("dialog")!
    .dispatchEvent(new Event("cancel", { cancelable: true }));
  await stable();
  expect(root().querySelector("dialog")).toBeNull();
});
it("ignores a stale search response after navigating to a newer query", async () => {
  const pending = pendingRequest<{ details: typeof catalog }>();
  const api = TestBed.inject(HomeApi);
  vi.spyOn(api, "getSearchFeed")
    .mockReturnValueOnce(pending.stream)
    .mockReturnValue(of({ details: [] }));
  await open("/home?tab=search&q=old");
  await harness.navigateByUrl("/home?tab=search&q=new");
  await stable();
  expect(root().textContent).toContain("No stories found");
  expect(pending.observed()).toBe(false);
  pending.resolve({ details: catalog });
  await stable();
  expect(root().querySelectorAll(".manga-card")).toHaveLength(0);
  expect(root().textContent).toContain("Exploring “new”");
});
it("displays search errors and retries the request", async () => {
  const api = TestBed.inject(HomeApi);
  vi.spyOn(api, "getSearchFeed").mockReturnValueOnce(
    throwError(() => new Error("Search offline")),
  );
  await open("/home?tab=search&q=fantasy");
  expect(root().textContent).toContain("Search offline");
  await click("Try again");
  await expect
    .poll(() => root().querySelectorAll(".manga-card").length)
    .toBeGreaterThan(0);
});
it("displays reader lookup errors and retries without exposing a profile", async () => {
  const api = TestBed.inject(HomeApi);
  vi.spyOn(api, "getReaders").mockReturnValueOnce(
    throwError(() => new Error("Readers offline")),
  );
  await open(`/home?tab=search&q=@${readers[1].username}`);
  expect(root().textContent).toContain("Readers offline");
  await click("Try again");
  await expect.poll(() => root().textContent).toContain(readers[1].name);
});
