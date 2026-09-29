import HomePage from "@/src/features/home/home.page";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<p role="status">Loading home…</p>}>
      <HomePage />
    </Suspense>
  );
}
