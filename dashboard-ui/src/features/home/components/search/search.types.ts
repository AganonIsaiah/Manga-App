import type { ReactNode } from "react";


export type SearchProps = {
  searchBar: ReactNode;
  submittedQuery: string;
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
};

export type SuggestionPillsProps = {
  pills: string[];
  selectedPills: string[];
  onToggle: (pill: string) => void;
};

export type View1SearchProps = {
  searchBar: ReactNode;
  query: string;
  onQueryChange: (query: string) => void;
  pills: string[];
  selectedPills: string[];
  onPillToggle: (pill: string) => void;
};

export type View2ListMangasProps = {
  query: string;
  onBack: () => void;
};

export type InputSearchBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
};

export type SearchTabProps = {
  initialQuery: string;
  onNavigate: (query: string) => void;
};