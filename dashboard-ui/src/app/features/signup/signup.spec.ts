import { expect, it, vi } from "vitest";
import { Signup } from "./signup";
import { renderComponent } from "../../../../tests/render-component";
import { mockSignupCredentials, mockAuthDelayMs } from "../../mocks/auth-mocks";

it("renders signup fields, login link and password visibility control", async () => {
  const { element, stable } = await renderComponent(Signup);
  expect(element.querySelectorAll("input")).toHaveLength(4);
  expect(element.querySelector('a[href^="/login"]')).toBeTruthy();
  element.querySelector<HTMLButtonElement>('[aria-label="Show password"]')!.click();
  await stable();
  expect(element.querySelector("#signup-password")?.getAttribute("type")).toBe("text");
});
it("validates signup and completes the mock without signing in", async () => {
  const { fixture } = await renderComponent(Signup);
  const component = fixture.componentInstance;
  component.submit();
  expect(component.form.touched).toBe(true);
  expect(component.pending()).toBe(false);
  component.form.setValue(mockSignupCredentials);
  vi.useFakeTimers();
  component.submit();
  expect(component.pending()).toBe(true);
  vi.advanceTimersByTime(mockAuthDelayMs + 1);
  expect(component.message()).toContain("No account has been created");
  expect(component.auth.session()).toBeNull();
  expect(component.form.controls.password.value).toBe("");
  expect(component.pending()).toBe(false);
});
it("cancels pending registration on destruction", async () => {
  const { fixture } = await renderComponent(Signup);
  fixture.componentInstance.form.setValue(mockSignupCredentials);
  vi.useFakeTimers();
  fixture.componentInstance.submit();
  fixture.destroy();
  vi.advanceTimersByTime(mockAuthDelayMs + 1);
  expect(fixture.componentInstance.message()).toBe("");
  expect(fixture.componentInstance.pending()).toBe(false);
});
