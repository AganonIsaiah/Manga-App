"use client";

import { useEffect, useState } from "react";

import { NavState } from "./home.types";

import ForYouFeed from "./components/ForYouFeed";
import Search from "./components/search/Search";
import Library from "./components/Library";
import Navbar from "./components/Navbar";

const NAV_STORAGE_KEY = "navState";

function isNavState(value: string | null): value is NavState {
  return value === "profile" || value === "search" || value === "discovery";
}

export default function HomePage() {
  const [navState, setNavState] = useState<NavState>("discovery");

  useEffect(() => {
    const saved = sessionStorage.getItem(NAV_STORAGE_KEY);
    if (isNavState(saved)) setNavState(saved);
  }, []);

  function handleNavigation(state: NavState) {
    setNavState(state);
    sessionStorage.setItem(NAV_STORAGE_KEY, state);
  }

  return (
    <div className="home h-dvh w-full px-2">
      <div className="h-[calc(100vh-50px)] flex flex-col gap-6 items-center justify-center">
        <Navbar navState={navState} onNavigate={handleNavigation} />

        {navState === "profile" && <Library />}
        {navState === "search" && <Search />}
        {navState === "discovery" && <ForYouFeed />}
      </div>
    </div>
  );
}
