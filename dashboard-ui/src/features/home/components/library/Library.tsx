"use client";
import { useState } from "react";
import type { LibraryTab, NavbarProps, ProfileCounts, ProfileReadings, ProfileBookmarks, ProfileDetails, ProfileMangaReviews } from "./library.types";
import { UserProfileApiResponse } from "../../home.api-types";
import { mockProfileCounts, mockProfileDetails } from "../../home.api-mocks";


function ProfileDetails() {
  return <div></div>;
}

function ProfileMangaReviews() {
  return <div></div>;
}

function ProfileBookmarks() {
  return <div></div>;
}

function ProfileReadings() {
  return (<div className="flex flex-col">



  </div>);
}

function Navbar({ counts, activeTab, onTabChange }: NavbarProps) {
  const { readings_count, bookmarks_count, reviews_count } = counts;

  const navConfig: { tab: LibraryTab; label: string; count?: number }[] = [
    { tab: "readings", label: "Readings", count: readings_count },
    { tab: "bookmarks", label: "Bookmarks", count: bookmarks_count },
    { tab: "reviews", label: "Reviews", count: reviews_count },
    { tab: "profile", label: "Profile" },
  ];

  return (
    <div className="flex justify-between">
      {navConfig.map(({ tab, label, count }) => (
        <button
          className="lib-navbar-btn"
          key={tab}
          onClick={() => onTabChange(tab)}
          disabled={activeTab === tab}
        >
          <p>{label}</p>
          {count && (
            <span
              className="flex justify-center items-center bg-slate-600
          font-medium w-10 h-6 max-sm:w-8 p-2 rounded-full shadow-sm
          max-[400px]:hidden
           "
            >
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Header({ profile }: { profile: ProfileDetails }) {
  const { name, username, account_age_months, header, date_joined } = profile;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-full bg-red-200"></div>

        <div className="flex flex-col items-start justify-center">
          <h2 className="text-2xl font-medium">{name}</h2>
          <p className="font-light text-tertiary">@{username}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-tertiary break-all">{header}</p>
        <span className="text-tertiary text-sm">
          Joined {date_joined} • Member for {account_age_months} month
          {account_age_months === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export default function Library({
  readings,
  bookmarks,
  reviews,
  profile,
  counts,
}: UserProfileApiResponse) {
  const [activeTab, setActiveTab] = useState<LibraryTab>("readings");

  return (
    <div className="home-height flex flex-col gap-4 w-full max-w-[600px]!">
      <Header profile={mockProfileDetails} />
      <hr className="secondary-border" />

      <Navbar
        counts={mockProfileCounts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === "readings" && <ProfileReadings />}
      {activeTab === "bookmarks" && <ProfileBookmarks />}
      {activeTab === "reviews" && <ProfileMangaReviews />}
      {activeTab === "profile" && <ProfileDetails />}
    </div>
  );
}
