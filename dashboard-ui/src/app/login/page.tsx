import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "@/src/features/auth/LoginPage";

export const metadata: Metadata = { title: "Sign in · Manga" };
export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <p role="status">Loading sign in…</p>
        </main>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
