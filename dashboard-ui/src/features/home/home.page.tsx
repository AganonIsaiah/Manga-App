"use client";

import { useState } from "react";
import { useScrollDirection } from "@/src/hooks/useScrollDirection";
import { Send } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  InputSearchBarProps,
  SearchTabProps,
} from "./components/search/search.types";

import ForYouFeed from "./components/for-you/ForYouFeed";
import { Search } from "./components/search/Search";
import Library from "./components/library/Library";
import Navbar from "./components/navbar/Navbar";
import { UserProfileApiResponse } from "./home.api-types";

export function InputSearchBar({
  query,
  onQueryChange,
  onSubmit,
}: InputSearchBarProps) {
  return (
    <form
      className="my-2 flex w-[520px] max-w-full items-center gap-2 rounded-md px-3 py-2 primary-border max-sm:w-[360px]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <input
        className="min-w-0 flex-1 bg-transparent pl-1 outline-none"
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-label="Search for manga by title, author, or description"
        placeholder="A dark twisted fantasy, like that kanye album but as a manga..."
      />

      <button
        type="submit"
        disabled={!query.trim()}
        className="btn-transitions shrink-0 rounded-full p-1.5 text-gray-400 hover:text-white disabled:cursor-not-allowed! disabled:opacity-40 disabled:hover:text-gray-400"
        aria-label="Search"
      >
        <Send size={16} aria-hidden="true" />
      </button>
    </form>
  );
}

function SearchTab({ initialQuery, onNavigate }: SearchTabProps) {
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit() {
    const nextQuery = query.trim();
    if (!nextQuery) return;

    onNavigate(nextQuery);
  }

  const searchBar = (
    <InputSearchBar
      query={query}
      onQueryChange={setQuery}
      onSubmit={handleSubmit}
    />
  );

  return (
    <div
      className={`home-height home-width flex flex-col items-center gap-6 ${
        initialQuery ? "justify-start" : "justify-center"
      }`}
    >
      {initialQuery && searchBar}
      <Search
        searchBar={initialQuery ? null : searchBar}
        submittedQuery={initialQuery}
        query={query}
        onQueryChange={setQuery}
        onClear={() => onNavigate("")}
      />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const activeTab = tab === "library" || tab === "search" ? tab : "discovery";
  const submittedQuery = searchParams.get("q")?.trim() ?? "";

  const {
    hidden,
    onScrollCapture,
    onWheelCapture,
    onTouchStartCapture,
    onTouchMoveCapture,
    onTouchEndCapture,
    reveal,
  } = useScrollDirection(
    `${activeTab}:${submittedQuery}`,
    12,
    activeTab === "discovery",
  );

  function navigateToSearch(query: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (query) {
      params.set("tab", "search");
      params.set("q", query);
    } else {
      params.delete("q");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      className="home relative min-h-0 flex-1 w-full px-2"
      onScrollCapture={onScrollCapture}
      onWheelCapture={onWheelCapture}
      onTouchStartCapture={onTouchStartCapture}
      onTouchMoveCapture={onTouchMoveCapture}
      onTouchEndCapture={onTouchEndCapture}
      onTouchCancelCapture={onTouchEndCapture}
    >
      <div
        onFocusCapture={reveal}
        className={`absolute inset-x-2 top-0 z-50 flex justify-center navbar-transitions ${
          hidden ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Navbar activeTab={activeTab} />
      </div>
      <div
        className={`h-full min-h-0 flex flex-col items-center justify-center navbar-transitions
      ${!hidden ? "pt-16" : ""}
      ${hidden && activeTab === "library" ? "pt-6" : ""}
      `}
      >
        {activeTab === "library" && (
          <Library userProfile={{} as UserProfileApiResponse} />
        )}
        {activeTab === "search" && (
          <SearchTab
            key={submittedQuery}
            initialQuery={submittedQuery}
            onNavigate={navigateToSearch}
          />
        )}
        {activeTab === "discovery" && <ForYouFeed />}
      </div>
    </div>
  );
}
