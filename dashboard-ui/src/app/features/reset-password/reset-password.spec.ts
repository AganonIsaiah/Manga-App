import { expect, it, vi } from "vitest";
import { of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { ResetPassword } from "./reset-password";
import { AuthService } from "../../services/auth/auth.services";
import { renderComponent } from "../../../../tests/render-component";

it("reports invalid reset links without showing a password form", async () => {
  const { element, fixture } = await renderComponent(ResetPassword);
  expect(element.querySelector('[role="alert"]')?.textContent).toContain(
    "invalid",
  );
  fixture.componentInstance.submit();
  expect(fixture.componentInstance.error()).toContain("invalid");
});
it("validates matching passwords and handles reset responses", async () => {
  const { fixture } = await renderComponent(ResetPassword);
  const component = fixture.componentInstance;
  Object.defineProperty(component, "token", { value: "test-reset-token" });
  component.submit();
  expect(component.error()).toContain("12 characters");
  component.form.setValue({
    password: "a-long-new-password",
    confirm: "different-password",
  });
  component.submit();
  expect(component.error()).toContain("do not match");
  component.form.controls.confirm.setValue("a-long-new-password");
  const reset = vi
    .spyOn(TestBed.inject(AuthService), "resetPassword")
    .mockReturnValue(throwError(() => new Error("Link expired")));
  component.submit();
  expect(component.error()).toBe("Link expired");
  reset.mockReturnValue(of("Password updated"));
  component.submit();
  expect(component.message()).toBe("Password updated");
  expect(component.form.controls.password.value).toBe("");
});
