import type { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/login/login").then((m) => m.Login),
  },
  {
    path: "home",
    loadComponent: () => import("./features/home/home").then((m) => m.Home),
  },
  { path: "", pathMatch: "full", redirectTo: "login" },
  { path: "**", redirectTo: "login" },
];
