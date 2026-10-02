
import { ProfileDetails } from "./library.types";

function ProfileDetail({ details }: { details: ProfileDetails }) {
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

  const totalRatings = Object.values(ratings).reduce((acc, val) => acc + val, 0);

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
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ratings</h2>
            <span className="text-sm text-tertiary font-semibold">
              {totalRatings} total
            </span>
          </div>


        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Bio</h2>
          <p className="text-sm text-slate-400">{bio}</p>
        </div>
      </div>
    </div>
  );
}
