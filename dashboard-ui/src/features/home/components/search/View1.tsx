import { Send, Sparkles, X } from "lucide-react";

type SuggestionPillsProps = {
  pills: string[];
  selectedPills: string[];
  onToggle: (pill: string) => void;
};

type View1SearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  pills: string[];
  selectedPills: string[];
  onPillToggle: (pill: string) => void;
};

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
  query,
  onQueryChange,
  onSubmit,
  pills,
  selectedPills,
  onPillToggle,
}: View1SearchProps) {
  const hasQuery = query.length > 0;

  return (
    <div className="flex flex-col gap-6 items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-semibold text-center">What Do You Want to Read?</h1>
        <p className="text-gray-400">
          Search a title/author, describe a story...
        </p>
      </div>

      <form
        className="my-2 flex w-[520px] max-sm:w-[360px] max-w-full items-center gap-2 rounded-md px-3 py-2 primary-border"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          className="pl-1 min-w-0 flex-1 bg-transparent outline-none"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search for manga by title, author, or description"
          placeholder="A dark twisted fantasy, like that kanye album but as a manga..."
        />

        <button
          type="submit"
          disabled={!query.trim()}
          className="btn-transitions shrink-0 rounded-full p-1.5 text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 disabled:cursor-not-allowed!"
          aria-label="Search"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </form>

      <SuggestionPills
        pills={pills}
        selectedPills={selectedPills}
        onToggle={onPillToggle}
      />

      <button
        type="button"
        onClick={() => onQueryChange("")}
        className="flex items-center justify-center gap-1 text-sm 
        btn-transitions shrink-0 rounded-full p-1 text-gray-400 enabled:hover:text-white
        disabled:cursor-not-allowed!
        "
        disabled={!hasQuery}
        aria-label="Clear search"
      >
        <span className="font-medium ">Clear All</span>
        <X size={14} aria-hidden="true" className="font-extralight"/>
      </button>
    </div>
  );
}
