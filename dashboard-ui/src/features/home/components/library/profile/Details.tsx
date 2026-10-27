"use client";
import Modal from "../../Modal";
import Image from "next/image";
import { useState } from "react";

import type { FavouritePanel } from "../../../home.types";
import { Star, X } from "lucide-react";
import type { ProfileDetails, ProfileDetailsRatings } from "../library.types";

function RatingsChart({ ratings }: { ratings: ProfileDetailsRatings }) {
  const {
    one_star,
    two_stars,
    three_stars,
    four_stars,
    five_stars,
    total_ratings,
  } = ratings;
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
            <span
              className="flex items-center gap-1 text-xs"
              aria-hidden="true"
            >
              {index + 1}
              <Star className="size-3 fill-orange-300 text-orange-300" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Details({
  details,
  favouritePanels,
  readingMood,
}: {
  details: ProfileDetails;
  favouritePanels: FavouritePanel[];
  readingMood: string;
}) {
  const [panel, setPanel] = useState<FavouritePanel | null>(null);
  return (
    <div className="profile-content">
      <div className="flex flex-col gap-8 min-w-0">
        <section>
          <div className="section-heading">
            <h2 className="text-lg font-semibold">Favourite manga</h2>
            <span className="text-xs text-slate-500">
              The ones that stay with you
            </span>
          </div>
          <div className="favourites-grid mt-3">
            {Object.values(details.favourite_manga).map((m, i) => (
              <article key={m.title} className="favourite-tile">
                <div
                  className="favourite-cover"
                  style={{ backgroundImage: `url("${m.cover_url}")` }}
                  role="img"
                  aria-label={`${m.title} cover`}
                >
                  <span className="favourite-rank">0{i + 1}</span>
                </div>
                <h3 className="text-xs font-medium mt-2">{m.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {m.authors.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className="section-heading">
            <h2 className="text-lg font-semibold">Recently read</h2>
            <span className="text-xs text-slate-500">
              A little reading history
            </span>
          </div>
          <div className="flex flex-col mt-3">
            {Object.values(details.recently_read).map((m) => (
              <article key={m.title} className="recent-row">
                <div
                  className="recent-cover"
                  style={{ backgroundImage: `url("${m.cover_url}")` }}
                  role="img"
                  aria-label={`${m.title} cover`}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium">{m.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Chapter {m.current_chapter}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {m.days_last_read === 0
                    ? "Today"
                    : m.days_last_read === 1
                      ? "Yesterday"
                      : `${m.days_last_read} days ago`}
                </span>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className="section-heading">
            <h2 className="text-lg font-semibold">Favourite panels</h2>
            <span className="text-xs text-slate-500">
              Moments worth keeping
            </span>
          </div>
          <div className="panels-grid mt-3">
            {favouritePanels.map((item) => (
              <button
                key={item.id}
                className="panel-tile"
                onClick={() => setPanel(item)}
                aria-label={`View favourite panel from ${item.title}`}
              >
                <Image
                  width={600}
                  height={450}
                  src={item.image}
                  alt={item.description}
                />
                <span>
                  {item.title}
                  <small>Chapter {item.chapter}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <aside className="flex flex-col gap-7">
        <RatingsChart ratings={details.ratings} />
        <div>
          <h2 className="text-lg font-semibold mb-2">Bio</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {details.bio}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 p-4">
          <p className="eyebrow">READING MOOD</p>
          <p className="text-sm text-orange-200 mt-2">{readingMood}</p>
        </div>
      </aside>
      {panel !== null && (
        <Modal onClose={() => setPanel(null)} aria-label="Favourite panel">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">{panel.title}</h2>
            <button
              className="action-icon"
              onClick={() => setPanel(null)}
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>
          <Image
            width={600}
            height={450}
            className="w-full rounded-lg"
            src={panel.image}
            alt={panel.description}
          />
          <p className="text-sm text-slate-400 mt-3">
            Chapter {panel.chapter} · Favourite panel
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Illustrative artwork for the demo collection.
          </p>
        </Modal>
      )}
    </div>
  );
}
