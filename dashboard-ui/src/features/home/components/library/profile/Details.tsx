
import { Star } from "lucide-react";
import type { ProfileDetails, ProfileReadings, ProfileDetailsRatings }from "../library.types";


function RatingsChart({ ratings }: { ratings: ProfileDetailsRatings }) {
  const { one_star, two_stars, three_stars, four_stars, five_stars, total_ratings } = ratings;
  const counts = [one_star, two_stars, three_stars, four_stars, five_stars];
  const maxCount = Math.max(...counts, 1);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ratings</h2>
        <span className="text-sm text-tertiary font-semibold">
          {total_ratings} total
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3 pt-2 pb-2">
        {counts.map((count, index) => (
          <div
            key={index + 1}
            className="flex min-w-0 flex-col items-center gap-2"
            aria-label={`${index + 1} ${index === 0 ? "star" : "stars"}: ${count} ratings`}
          >
            <span className="text-xs font-medium" aria-hidden="true">
              {count}
            </span>
            <div className="flex h-24 w-full items-end" aria-hidden="true">
              <div
                className="w-full rounded-t-sm bg-orange-300"
                style={{ height: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="flex items-center gap-1 text-xs" aria-hidden="true">
              {index + 1}
              <Star className="size-3 fill-orange-300 text-orange-300" />
            </span>
          </div>
        ))}
      </div>


    </div>

  );
}

export default function Details({ details }: { details: ProfileDetails }) {
  const { bio, favourite_manga, recently_read, location, ratings } = details;

  const mangasConfig = [
    {
      label: "Favourite manga",
      mangas: Object.values(favourite_manga),
    },
    {
      label: "Recently read",
      mangas: Object.values(recently_read),
    },
  ] satisfies {
    label: string;
    mangas: ProfileReadings[];
  }[];

  return (
    <div className="flex justify-between max-[540px]:flex-col max-[540px]:gap-4">
      <div className="flex flex-col min-[540px]:w-[62%]">
        {mangasConfig.map(({ label, mangas }) => (
          <section key={label} className="flex flex-col gap-2">
            <h2 className="font-medium">{label}</h2>
            <hr className="secondary-border h-[0.25px]!" />
            <div className=" grid grid-cols-4 gap-2">
              {mangas.map((manga) => (
                <div key={manga.title} className="flex flex-col gap-0.5">
                  <img src={manga.cover_url} alt={`${manga.title} cover`} />

                  <p className="text-sm">{manga.title}</p>
                  <div
                    className={`
                      flex items-center gap-1
                      ${label === "Favourite manga" ? "hidden" : ""}`}
                  >
                    <p className="text-xs">Ch. {manga.current_chapter}</p>
                    <span className="text-xs">•</span>
                    <p className="text-xs">

                      {manga.days_last_read === 1 ? 'Yesterday' : `${manga.days_last_read} days ago`}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-1 min-[540px]:w-[35%] ">

        <RatingsChart ratings={ratings}/>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Bio</h2>
          <p className="text-sm text-slate-400">{bio}</p>
        </div>
      </div>
    </div>
  );
}
