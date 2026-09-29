"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Library, Search, Compass } from "lucide-react";

type NavbarProps = {
  activeTab: string;
};

const navConfig = [
  { tab: "library", label: "Library", icon: Library },
  { tab: "search", label: "Search", icon: Search },
  { tab: "discovery", label: "For you", icon: Compass },
];

export default function Navbar({ activeTab }: NavbarProps) {
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

        return (
          <Link
            key={tab}
            href={`${pathname}?${params.toString()}`}
            scroll={false}
            className="navbar-btn"
            aria-current={activeTab === tab ? "page" : undefined}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
