"use client";
import { useState } from "react";

import { mockSuggestionPills } from "../../home.mock-api";

import View1Search from "./View1";

export default function Search() {
  const [query, setQuery] = useState("");

  const suggestionPills = mockSuggestionPills;

  const queryTokens = query
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const selectedPills = suggestionPills.filter((pill) =>
    queryTokens.includes(pill),
  );

  function togglePill(pill: string) {
    const nextTokens = queryTokens.includes(pill)
      ? queryTokens.filter((token) => token !== pill)
      : [...queryTokens, pill];

    setQuery(nextTokens.join(", "));
  }

  function handleSubmit() {
    if (!query.trim()) return;
    // TODO: navigate to /results?q=... or switch to View2
    console.log("search:", query);
  }

  return (
    <div className="home-height home-width flex flex-col items-center justify-center">
      <View1Search
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSubmit}
        pills={suggestionPills}
        selectedPills={selectedPills}
        onPillToggle={togglePill}
      />
    </div>
  );
}