// Navbar.tsx

import { Library, Search, Compass, LucideIcon } from "lucide-react";

import { NavState } from "../home.types";

type NavbarProps = {
  navState: NavState;
  onNavigate: (state: NavState) => void;
};

const navConfig: Record<NavState, { label: string; icon: LucideIcon }> = {
  profile: { label: "Library", icon: Library },
  search: { label: "Search", icon: Search },
  discovery: { label: "For you", icon: Compass },
};

const navOrder: NavState[] = ["profile", "search", "discovery"];

export default function Navbar({ navState, onNavigate }: NavbarProps) {
  function renderNavButton(state: NavState) {
    const { label, icon: Icon } = navConfig[state];

    return (
      <button
        key={state}
        type="button"
        className="navbar-btn"
        disabled={navState === state}
        onClick={() => onNavigate(state)}
      >
        <Icon size={16} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <nav
      aria-label="Home navigation"
      className="primary-border primary-clr flex home-width items-center justify-between rounded-full px-3 py-2"
    >
      {navOrder.map(renderNavButton)}
    </nav>
  );
}