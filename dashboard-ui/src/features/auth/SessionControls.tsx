"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "./auth.service";
import { useAuthUsername } from "./useAuth";

export default function SessionControls() {
  const username = useAuthUsername();
  const router = useRouter();
  const params = useSearchParams();
  if (!username)
    return (
      <Link
        className="auth-text-link"
        href={`/login?next=${encodeURIComponent(`/home?${params.toString()}`)}`}
      >
        Sign in
      </Link>
    );
  return (
    <button
      className="auth-text-link"
      onClick={() => {
        signOut();
        router.replace("/login");
      }}
    >
      <LogOut size={13} aria-hidden="true" />
      Sign out
    </button>
  );
}
