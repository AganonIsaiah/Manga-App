import { X } from "lucide-react";
import { SuggestionPillsProps, View1SearchProps } from "./search.types";

function SuggestionPills({
  pills,
  selectedPills,
  onToggle,
}: SuggestionPillsProps) {
  if (pills.length === 0) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-2 max-w-[600px]">
      {pills.map((pill) => {
        const isSelected = selectedPills.includes(pill);

        return (
          <li key={pill}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(pill)}
              className={`btn-transitions rounded-full px-3 py-1 text-sm primary-border hover:text-white ${
                isSelected ? "text-white border-white!" : "text-slate-400"
              }`}
            >
              {pill}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function View1Search({
  searchBar,
  query,
  onQueryChange,
  pills,
  selectedPills,
  onPillToggle,
}: View1SearchProps) {
  const hasQuery = query.length > 0;

  return (
    <div className="flex flex-col gap-6 items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-3">
        <h1 className="text-4xl font-semibold text-center">
          What Do You Want to Read?
        </h1>
        <p className="text-gray-400">
          Search a title or author, describe a story...
        </p>
      </div>

      {searchBar}

      <SuggestionPills
        pills={pills}
        selectedPills={selectedPills}
        onToggle={onPillToggle}
      />

      <button
        type="button"
        onClick={() => onQueryChange("")}
        className="btn-transitions flex shrink-0 items-center justify-center gap-1 rounded-full p-1 text-sm text-gray-400 enabled:hover:text-white disabled:cursor-not-allowed!"
        disabled={!hasQuery}
        aria-label="Clear search"
      >
        <span className="font-medium ">Clear All</span>
        <X size={14} aria-hidden="true" className="font-extralight" />
      </button>
    </div>
  );
}
