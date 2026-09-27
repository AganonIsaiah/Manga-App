// Navbar.tsx
import { NavState } from "../home.types";

type NavbarProps = {
  navState: NavState;
  onNavigate: (state: NavState) => void;
};

export default function Navbar({
  navState,
  onNavigate,
}: NavbarProps) {
  return (
    <div className="flex w-[300px] items-center justify-between rounded-full bg-slate-700 px-3 py-1.5">
      <button
        className="navbar-btn"
        disabled={navState === "profile"}
        onClick={() => onNavigate("profile")}
      >
        Library
      </button>

      <button
        className="navbar-btn"
        disabled={navState === "search"}
        onClick={() => onNavigate("search")}
      >
        Search
      </button>

      <button
        className="navbar-btn"
        disabled={navState === "discovery"}
        onClick={() => onNavigate("discovery")}
      >
        For you
      </button>
    </div>
  );
}