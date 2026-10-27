import Link from "next/link";
import { BookOpen, LogIn } from "lucide-react";

export default function LibrarySignIn() {
  return (
    <section className="library-guest" aria-labelledby="library-sign-in-title">
      <BookOpen size={28} className="text-orange-300" aria-hidden="true" />
      <h1 id="library-sign-in-title">Your library</h1>
      <p>Sign in to see your readings, bookmarks, and reviews.</p>
      <Link
        className="action-primary"
        href="/login?next=%2Fhome%3Ftab%3Dlibrary"
      >
        <LogIn size={16} aria-hidden="true" />
        Sign in
      </Link>
      <Link className="auth-text-link" href="/home?tab=search">
        Discover manga
      </Link>
    </section>
  );
}
