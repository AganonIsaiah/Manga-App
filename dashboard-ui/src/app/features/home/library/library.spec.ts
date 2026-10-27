import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { BrowserStorage } from "../../../services/browser-storage/browser-storage.services";
import { expect, it, vi } from "vitest";
import { Library } from "./library";
import { renderComponent } from "../../../../../tests/render-component";
import { mockProfileDetails } from "../../../mocks/home-mocks";

it("does not expose the demo profile to a guest", async () => {
  const { element } = await renderComponent(Library);
  expect(element.textContent).toContain("Your library");
  expect(element.textContent).not.toContain(mockProfileDetails.name);
});
it("switches an authenticated library between readings, bookmarks, and review editing", async () => {
  const { fixture, element, stable } = await renderComponent(
    Library,
    {},
    {},
    "div",
    true,
  );
  fixture.componentInstance.changeTab("readings");
  await stable();
  expect(element.querySelector("progress")).toBeTruthy();
  fixture.componentInstance.changeTab("bookmarks");
  await stable();
  expect(element.textContent).toContain("Saved for later");
  fixture.componentInstance.changeTab("reviews");
  fixture.componentInstance.startReview();
  await stable();
  expect(element.querySelector("dialog")?.getAttribute("aria-label")).toBe(
    "Write a review",
  );
  expect(element.querySelector("textarea")).toBeTruthy();
});

it("keeps the initial avatar, previews a selected photo, and saves through auth", async () => {
  const { fixture, element, stable, store } = await renderComponent(
    Library,
    {},
    {},
    "div",
    true,
  );
  const browser = TestBed.inject(BrowserStorage);
  vi.spyOn(browser, "createObjectUrl").mockReturnValue("blob:avatar-preview");
  const revoke = vi
    .spyOn(browser, "revokeObjectUrl")
    .mockImplementation(() => {});
  const user = store.auth.session()!.user;
  const upload = vi
    .spyOn(store.auth, "uploadAvatar")
    .mockReturnValue(
      of({ ...user, avatar_url: "https://example.test/avatar.webp" }),
    );
  expect(
    element.querySelector('[aria-label="Change profile photo"]')?.textContent,
  ).toContain(user.name[0]);
  const file = new File(["photo"], "avatar.png", { type: "image/png" });
  fixture.componentInstance.selectAvatar({
    target: { files: [file], value: "" },
  } as unknown as Event);
  await stable();
  expect(element.querySelector(".avatar-preview")?.getAttribute("src")).toBe(
    "blob:avatar-preview",
  );
  expect(upload).not.toHaveBeenCalled();
  fixture.componentInstance.saveAvatar();
  expect(upload).toHaveBeenCalledWith(file);
  expect(fixture.componentInstance.avatarPreview()).toBeNull();
  expect(revoke).toHaveBeenCalledWith("blob:avatar-preview");
});

it("rejects invalid photos and retains a retryable preview on upload failure", async () => {
  const { fixture, store } = await renderComponent(
    Library,
    {},
    {},
    "div",
    true,
  );
  const component = fixture.componentInstance;
  component.selectAvatar({
    target: {
      files: [new File(["svg"], "avatar.svg", { type: "image/svg+xml" })],
      value: "",
    },
  } as unknown as Event);
  expect(component.avatarError()).toContain("JPEG");
  vi.spyOn(TestBed.inject(BrowserStorage), "createObjectUrl").mockReturnValue(
    "blob:preview",
  );
  vi.spyOn(
    TestBed.inject(BrowserStorage),
    "revokeObjectUrl",
  ).mockImplementation(() => {});
  component.selectAvatar({
    target: {
      files: [new File(["png"], "avatar.png", { type: "image/png" })],
      value: "",
    },
  } as unknown as Event);
  vi.spyOn(store.auth, "uploadAvatar").mockReturnValue(
    throwError(() => new Error("Upload unavailable")),
  );
  component.saveAvatar();
  expect(component.avatarError()).toBe("Upload unavailable");
  expect(component.avatarPending()).toBe(false);
  expect(component.avatarPreview()).toBe("blob:preview");
  component.closeAvatarPreview();
});
