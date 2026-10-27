"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Library, Search, Compass, LogIn } from "lucide-react";

import { useAuthUsername } from "../../../auth/useAuth";

import { NavbarProps } from "./navbar.types";

const navConfig = [
  { tab: "library", label: "Library", icon: Library },
  { tab: "search", label: "Search", icon: Search },
  { tab: "discovery", label: "For you", icon: Compass },
];

export default function Navbar({ activeTab }: NavbarProps) {
  const username = useAuthUsername();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav
      aria-label="Home navigation"
      className="primary-border primary-clr flex home-width items-center justify-between rounded-full px-3 py-2"
    >
      {navConfig.map(({ tab, label, icon: Icon }) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        params.delete("user");

        const isSignIn = tab === "library" && !username;
        const NavIcon = isSignIn ? LogIn : Icon;
        const href = isSignIn
          ? "/login?next=%2Fhome%3Ftab%3Dlibrary"
          : `${pathname}?${params.toString()}`;
        return (
          <Link
            key={tab}
            href={href}
            scroll={false}
            className="navbar-btn"
            aria-current={activeTab === tab ? "page" : undefined}
          >
            <NavIcon size={16} aria-hidden="true" />
            <span>{isSignIn ? "Sign in" : label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
