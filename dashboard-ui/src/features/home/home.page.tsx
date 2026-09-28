// home.page.tsx
"use client";

import { useEffect, useState } from "react";

import { NavState } from "./home.types";

import ForYouFeed from "./components/ForYouFeed";
import Search from "./components/Search";
import Library from "./components/Library";
import Navbar from "./components/Navbar";

function isNavState(value: string | null): value is NavState {
  return value === "profile" || value === "search" || value === "discovery";
}

export default function HomePage() {
  const [navState, setNavState] = useState<NavState>("discovery");

  useEffect(() => {
    const savedState = sessionStorage.getItem("navState");

    if (isNavState(savedState)) {
      setNavState(savedState);
    }
  }, []);

  function handleNavigation(state: NavState) {
    setNavState(state);
    sessionStorage.setItem("navState", state);
  }

  return (
    <div className=" h-screen w-screen  px-2 pb-4 pt-2">
      <div className="h-[calc(100vh-20px)] flex flex-col gap-3 items-center justify-center">
        <Navbar navState={navState} onNavigate={handleNavigation} />

        {navState === "profile" && <Library />}
        {navState === "search" && <Search />}
        {navState === "discovery" && <ForYouFeed />}
      </div>
    </div>
  );
}
