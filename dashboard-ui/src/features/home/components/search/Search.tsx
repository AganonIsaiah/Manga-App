import { mockSuggestionPills } from "../../home.api-mocks";
import { SearchProps } from "./search.types";

import View1Search from "./View1";
import View2ListMangas from "./View2";

export function Search({
  searchBar,
  submittedQuery,
  query,
  onQueryChange,
  onClear,
}: SearchProps) {
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

    onQueryChange(nextTokens.join(", "));
  }

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {submittedQuery ? (
        <View2ListMangas
          query={submittedQuery}
          onBack={onClear}
        />
      ) : (
        <View1Search
          searchBar={searchBar}
          query={query}
          onQueryChange={onQueryChange}
          pills={suggestionPills}
          selectedPills={selectedPills}
          onPillToggle={togglePill}
        />
      )}
    </div>
  );
}

export default Search;
