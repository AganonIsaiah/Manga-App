import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import LoginPage from "./LoginPage";
import { authConfig } from "./auth.config";
import { mockLoginCredentials } from "./auth-mocks";
import { getSession, signInToDemo, signOut } from "./auth.service";
import { navigation } from "../../../tests/navigation-mocks";

beforeEach(() => {
  authConfig.useMocks = true;
  signOut();
});
it("offers guest browsing without starting a session", () => {
  render(<LoginPage />);
  expect(screen.getByRole("link", { name: /Browse as guest/ })).toHaveAttribute(
    "href",
    "/home",
  );
  expect(getSession()).toBeNull();
});
it("toggles password visibility and remembers the demo session", async () => {
  render(<LoginPage />);
  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  await userEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
  await userEvent.click(screen.getByLabelText("Remember me"));
  await userEvent.click(
    screen.getByRole("button", { name: "Use demo account" }),
  );
  expect(screen.getByRole("button", { name: /Signing in/ })).toBeDisabled();
  await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/home"));
  expect(localStorage.getItem(authConfig.sessionKey)).not.toBeNull();
});
it("reports bad credentials and then accepts the demo credentials", async () => {
  navigation.params = new URLSearchParams("next=/home?tab=library");
  render(<LoginPage />);
  await userEvent.type(
    screen.getByLabelText("Email or username"),
    mockLoginCredentials.identifier,
  );
  await userEvent.type(screen.getByLabelText("Password"), "incorrect-password");
  await userEvent.click(
    screen.getByRole("button", { name: "Sign in" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(/doesn’t match/);
  await userEvent.clear(screen.getByLabelText("Password"));
  await userEvent.type(
    screen.getByLabelText("Password"),
    mockLoginCredentials.password,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Sign in" }),
  );
  await waitFor(() =>
    expect(navigation.replace).toHaveBeenCalledWith("/home?tab=library"),
  );
});
it("provides honest mock password recovery and returns to sign in", async () => {
  render(<LoginPage />);
  await userEvent.click(
    screen.getByRole("button", { name: "Forgot password?" }),
  );
  await userEvent.type(
    screen.getByLabelText("Email address"),
    mockLoginCredentials.identifier,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Send reset link" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    /no email was sent/,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Back to sign in" }),
  );
  expect(
    screen.getByRole("heading", { name: "Welcome back" }),
  ).toBeInTheDocument();
});
it("redirects an already signed-in user", async () => {
  await act(async () => {
    await signInToDemo();
  });
  render(<LoginPage />);
  expect(navigation.replace).toHaveBeenCalledWith("/home");
});
it("hides the demo button when the mock adapter is disabled", () => {
  authConfig.useMocks = false;
  render(<LoginPage />);
  expect(
    screen.queryByRole("button", { name: "Use demo account" }),
  ).not.toBeInTheDocument();
});
