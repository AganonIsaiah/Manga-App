// home.page.tsx
"use client";

import { useEffect, useState } from "react";

import { NavState } from "./home.types";

import ForYouFeed from "./components/ForYouFeed";
import Navbar from "./components/Navbar";

function isNavState(value: string | null): value is NavState {
  return (
    value === "profile" ||
    value === "search" ||
    value === "discovery"
  );
}

export default function HomePage() {
  const [navState, setNavState] = useState<NavState>("search");

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
    <div className="flex h-screen w-screen flex-col items-center justify-center px-2 pb-12 pt-8">
      <Navbar
        navState={navState}
        onNavigate={handleNavigation}
      />

      {/* {navState === "profile" && <UserProfile />}
      {navState === "search" && <Search />} */}
      {navState === "discovery" && <ForYouFeed />}
    </div>
  );
}