import { TestBed } from "@angular/core/testing";
import { AuthService } from "../../services/auth/auth.services";
import { mockAuthDelayMs } from "../../mocks/auth-mocks";
import { expect, it, vi } from "vitest";
import { Login } from "./login";
import { renderComponent } from "../../../../tests/render-component";

it("renders the login form with guest browsing and demo access", async () => {
  const { element } = await renderComponent(Login);
  expect(element.querySelector("h1")?.textContent).toContain("Welcome back");
  expect(element.querySelector('[autocomplete="username"]')).toBeTruthy();
  expect(element.textContent).toContain("Use demo account");
});
it("toggles password visibility and refuses an empty form", async () => {
  const { fixture, element, stable } = await renderComponent(Login);
  element
    .querySelector<HTMLButtonElement>('[aria-label="Show password"]')!
    .click();
  await stable();
  expect(element.querySelector("#login-password")?.getAttribute("type")).toBe(
    "text",
  );
  await fixture.componentInstance.submit();
  expect(fixture.componentInstance.form.touched).toBe(true);
  expect(fixture.componentInstance.pending()).toBe(false);
});

it("cancels a pending login when the component is destroyed", async () => {
  const { fixture } = await renderComponent(Login);
  vi.useFakeTimers();
  fixture.componentInstance.submit(true);
  expect(fixture.componentInstance.pending()).toBe(true);
  fixture.destroy();
  vi.advanceTimersByTime(mockAuthDelayMs + 1);
  expect(TestBed.inject(AuthService).session()).toBeNull();
  expect(fixture.componentInstance.pending()).toBe(false);
});
