"use client";

import { useSearchParams } from "next/navigation";

import ForYouFeed from "./components/ForYouFeed";
import Search from "./components/search/Search";
import Library from "./components/Library";
import Navbar from "./components/Navbar";

export default function HomePage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const activeTab = tab === "library" || tab === "search" ? tab : "discovery";

  return (
    <div className="home h-dvh w-full px-2">
      <div className="h-[calc(100vh-50px)] flex flex-col gap-6 items-center justify-center">
        <Navbar activeTab={activeTab} />

        {activeTab === "library" && <Library />}
        {activeTab === "search" && <Search />}
        {activeTab === "discovery" && <ForYouFeed />}
      </div>
    </div>
  );
}
