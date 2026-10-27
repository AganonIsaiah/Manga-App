import { TestBed } from "@angular/core/testing";
import { expect, it, vi } from "vitest";
import { of, throwError } from "rxjs";
import { ConfirmEmail } from "./confirm-email";
import { AuthService } from "../../services/auth/auth.services";
import { mockAuthUser } from "../../mocks/auth-mocks";
import { renderComponent } from "../../../../tests/render-component";

it("shows inbox guidance for visits without a token without sending a verification request", async () => {
  const { fixture, element } = await renderComponent(ConfirmEmail);
  const verify = vi.spyOn(TestBed.inject(AuthService), "confirmEmail");
  fixture.componentInstance.confirm();
  expect(verify).not.toHaveBeenCalled();
  expect(element.textContent).toContain("Check your inbox");
  expect(element.querySelector('[role="alert"]')).toBeNull();
});
it("confirms only on user action and handles expired links", async () => {
  const { fixture } = await renderComponent(ConfirmEmail);
  const component = fixture.componentInstance;
  Object.defineProperty(component, "token", {
    value: "test-confirmation-token",
  });
  const verify = vi
    .spyOn(TestBed.inject(AuthService), "confirmEmail")
    .mockReturnValue(throwError(() => new Error("Link expired")));
  component.confirm();
  expect(component.error()).toBe("Link expired");
  verify.mockReturnValue(
    of({ user: mockAuthUser, expiresAt: Date.now() + 900000 }),
  );
  component.confirm();
  expect(component.complete()).toBe(true);
  expect(component.pending()).toBe(false);
});
