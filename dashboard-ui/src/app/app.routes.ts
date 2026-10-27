import type { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "confirm-email",
    loadComponent: () =>
      import("./features/confirm-email/confirm-email").then(
        (m) => m.ConfirmEmail,
      ),
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("./features/reset-password/reset-password").then(
        (m) => m.ResetPassword,
      ),
  },
  {
    path: "signup",
    loadComponent: () =>
      import("./features/signup/signup").then((m) => m.Signup),
  },
  {
    path: "login",
    loadComponent: () => import("./features/login/login").then((m) => m.Login),
  },
  {
    path: "home",
    loadComponent: () => import("./features/home/home").then((m) => m.Home),
  },
  { path: "", pathMatch: "full", redirectTo: "login" },
  { path: "**", redirectTo: "login" },
];
