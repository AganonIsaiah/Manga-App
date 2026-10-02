"use client";
import { useState } from "react";
import type {
  LibraryTab,
  NavbarProps,
  ProfileReadings,
  ProfileBookmarks,
  ProfileDetails,
  ProfileMangaReviews,
  HeaderProps,
} from "./library.types";
import { UserProfileApiResponse } from "../../home.api-types";
import { mockProfileCounts, mockProfileDetails } from "../../home.api-mocks";

import Details from "./Details";


function ProfileMangaReviews() {
  return <div></div>;
}

function ProfileBookmarks() {
  return <div></div>;
}

function ProfileReadings() {
  return <div className="flex flex-col"></div>;
}

function Navbar({ counts, activeTab, onTabChange }: NavbarProps) {
  const { readings_count, bookmarks_count, reviews_count } = counts;

  const navConfig: { tab: LibraryTab; label: string; count?: number }[] = [
    { tab: "profile", label: "Profile" },
    { tab: "readings", label: "Readings", count: readings_count },
    { tab: "bookmarks", label: "Bookmarks", count: bookmarks_count },
    { tab: "reviews", label: "Reviews", count: reviews_count },
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
          font-medium w-8 h-6 p-2 rounded-full shadow-sm
          max-[434px]:hidden"
            >
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Header({ profile, activeTab }: HeaderProps) {
  const {
    name,
    username,
    account_age_months,
    header,
    date_joined,
    read_all_time,
    read_this_year,
    followers,
    following,
  } = profile;

  const [month, year] = date_joined.split(" ");
  const followerCount = followers.length;
  const followingCount = following.length;

  const countConfig: { label: string; count: number }[] = [
    { label: "Read this year", count: read_this_year },
    { label: "Read all time", count: read_all_time },
    { label: "Followers", count: followerCount },
    { label: "Following", count: followingCount },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex gap-4 w-full justify-between">
        <div className={`flex gap-4 `}>
          <div className="w-20 h-20 rounded-full bg-red-200"></div>

          <div className="flex flex-col items-start justify-center">
            <h2 className="text-2xl font-medium">{name}</h2>
            <p className="font-extralight text-tertiary text-sm">@{username}</p>
          </div>
        </div>
        <div className="flex justify-between items-center gap-8">
          {countConfig.map(({ label, count }) => (
            <div
              key={label}
              className={`flex flex-col gap-0.5 justify-center items-center 
                ${label === "Read this year" ? "max-[640px]:hidden" : ""}
                ${label === "Read all time" ? "max-[540px]:hidden" : ""}
                `}
            >
              <h1 className="text-3xl max-sm:text-2xl font-semibold">
                {count}
              </h1>
              <span className="text-slate-400 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {activeTab === "profile" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <p className="text-sm text-tertiary break-all">{header}</p>
            <span className="text-tertiary text-xs">
              Joined {month.slice(0, 3)}. {year} • Member for{" "}
              {account_age_months} month
              {account_age_months === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Library({
  userProfile
}: { userProfile: UserProfileApiResponse}) {
  const [activeTab, setActiveTab] = useState<LibraryTab>("profile");

  return (
    <div className="px-4 home-height flex flex-col gap-4 w-full overflow-auto max-w-[1000px]">
      <div className="flex flex-col gap-4 sticky top-0 z-30 bg-[#0D1117] shadow-lg">
        <Header profile={mockProfileDetails} activeTab={activeTab} />
        <hr className="secondary-border h-[1px]!" />

        <Navbar
          counts={mockProfileCounts}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
      {activeTab === "readings" && <ProfileReadings />}
      {activeTab === "bookmarks" && <ProfileBookmarks />}
      {activeTab === "reviews" && <ProfileMangaReviews />}
      {activeTab === "profile" && (
        <Details details={mockProfileDetails} />
      )}
    </div>
  );
}
