import { TestBed } from "@angular/core/testing";
import { HttpTestingController } from "@angular/common/http/testing";
import { expect, it, vi } from "vitest";
import { Signup } from "./signup";
import { renderComponent } from "../../../../tests/render-component";
import { mockSignupCredentials, mockAuthDelayMs } from "../../mocks/auth-mocks";

it("renders signup fields, login link and password visibility control", async () => {
  const { element, stable } = await renderComponent(Signup);
  expect(element.querySelectorAll("input")).toHaveLength(6);
  expect(element.querySelector('a[href^="/login"]')).toBeTruthy();
  expect(element.querySelector("#signup-country")).toBeTruthy();
  expect(element.querySelector("#signup-city")).toBeTruthy();
  element
    .querySelector<HTMLButtonElement>('[aria-label="Show password"]')!
    .click();
  await stable();
  expect(element.querySelector("#signup-password")?.getAttribute("type")).toBe(
    "text",
  );
});
it("validates signup and completes the mock without signing in", async () => {
  const { fixture } = await renderComponent(Signup);
  const component = fixture.componentInstance;
  component.submit();
  expect(component.form.touched).toBe(true);
  expect(component.pending()).toBe(false);
  component.form.patchValue(mockSignupCredentials);
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
  fixture.componentInstance.form.patchValue(mockSignupCredentials);
  vi.useFakeTimers();
  fixture.componentInstance.submit();
  fixture.destroy();
  vi.advanceTimersByTime(mockAuthDelayMs + 1);
  expect(fixture.componentInstance.message()).toBe("");
  expect(fixture.componentInstance.pending()).toBe(false);
});

it("clears the city on country changes and reuses loaded suggestions", async () => {
  const { fixture } = await renderComponent(Signup);
  const component = fixture.componentInstance;
  const http = TestBed.inject(HttpTestingController);
  component.form.controls.country_code.setValue("CA");
  http
    .expectOne("/locations/cities.json")
    .flush({ CA: ["Toronto"], FR: ["Paris"] });
  component.form.controls.city.setValue("Toronto");
  component.form.controls.country_code.setValue("FR");
  expect(component.form.controls.city.value).toBe("");
  expect(component.cities()).toEqual([{ value: "Paris", label: "Paris" }]);
  component.form.controls.country_code.setValue("");
  expect(component.cities()).toEqual([]);
  http.verify();
});
