"use client";
import Modal from "../Modal";
import LibrarySignIn from "./LibrarySignIn";
import { useAuthUsername } from "../../../auth/useAuth";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Star, Trash2, Pencil, X } from "lucide-react";
import { getUserProfile } from "../../home.service";
import { currentProfile } from "../../library-state";
import { useServiceResource } from "../../../../hooks/useServiceResource";
import type { UserProfileData } from "../../home.api-types";
import ServiceNotice from "../ServiceNotice";
import SessionControls from "../../../auth/SessionControls";
import { useHome } from "../../home.context";
import type { Review } from "../../home.types";
import Details from "./profile/Details";
import People from "../People";
import MangaCard from "../MangaCard";
import type { LibraryTab } from "./library.types";

function LibraryContent({
  view,
  isPublic = false,
}: {
  view: UserProfileData;
  isPublic?: boolean;
}) {
  const { state, catalog, toggleFollow, read, saveReview, deleteReview } =
    useHome();
  const reader = isPublic ? view.profile : null;
  const [tab, setTab] = useState<LibraryTab>("profile");
  const [connections, setConnections] = useState<
    "followers" | "following" | null
  >(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Review | null>(null);
  const profile = reader
    ? view.profile
    : currentProfile(view.profile, state, catalog);
  const readingProgress = reader ? view.state.progress : state.progress;
  const readingIds = Object.keys(readingProgress);
  const bookmarkIds = reader ? view.state.bookmarks : state.bookmarks;
  const reviews = reader ? view.state.reviews : state.reviews;
  const counts = {
    profile: undefined,
    readings: readingIds.length,
    bookmarks: bookmarkIds.length,
    reviews: reviews.length,
  };
  const list = catalog
    .filter(
      (m) =>
        (tab === "readings" ? readingIds : bookmarkIds).includes(m.id) &&
        m.title.toLowerCase().includes(query.toLowerCase()),
    )
    .filter(
      (m) =>
        tab !== "readings" ||
        filter === "All" ||
        (filter === "Completed"
          ? (readingProgress[m.id] ?? 1) >=
            Number(m.recent_chapter.replace(/\D/g, ""))
          : (readingProgress[m.id] ?? 1) <
            Number(m.recent_chapter.replace(/\D/g, ""))),
    );
  return (
    <div className={`library-shell`} key={profile.username}>
      <div className="library-session">
        <SessionControls />
      </div>

      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="avatar profile-avatar"
              style={{ background: view.avatarColor }}
            >
              {profile.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold truncate">
                {profile.name}
              </h1>
              <p className="text-sm text-slate-400">@{profile.username}</p>
            </div>
          </div>
          {reader && (
            <button
              className="action-secondary"
              onClick={() => toggleFollow(reader.username)}
              aria-pressed={state.following.includes(reader.username)}
            >
              {state.following.includes(reader.username)
                ? "Following"
                : "Follow"}
            </button>
          )}
        </div>
        <div className="profile-stats">
          {[
            { label: "Read this year", count: profile.read_this_year },
            { label: "Read all time", count: profile.read_all_time },
            {
              label: "Followers",
              count:
                profile.followers.length +
                (reader && state.following.includes(reader.username) ? 1 : 0),
              type: "followers" as const,
            },
            {
              label: "Following",
              count: profile.following.length,
              type: "following" as const,
            },
          ].map((s) => (
            <button
              key={s.label}
              disabled={!s.type}
              onClick={() => setConnections(s.type!)}
              className="stat"
            >
              <strong>{s.count}</strong>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        {tab === "profile" && (
          <div>
            <p className="text-sm text-slate-300">{profile.header}</p>
            <p className="text-xs text-slate-500 mt-2">
              Joined {profile.date_joined} · {profile.location}
            </p>
          </div>
        )}
        {reader && (
          <Link href="/home?tab=library" className="text-xs text-orange-200">
            ← Back to your library
          </Link>
        )}
      </header>

      <nav className="library-tabs" aria-label="Library sections">
        {(["profile", "readings", "bookmarks", "reviews"] as LibraryTab[]).map(
          (t) => (
            <button
              key={t}
              aria-current={tab === t ? "page" : undefined}
              onClick={() => {
                setTab(t);
                setQuery("");
                setFilter("All");
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {counts[t] !== undefined && <span>{counts[t]}</span>}
            </button>
          ),
        )}
      </nav>
      {tab === "profile" ? (
        <Details
          details={profile}
          favouritePanels={view.favouritePanels}
          readingMood={view.readingMood}
        />
      ) : (
        <section className="flex flex-col gap-5">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR LITTLE CORNER OF MANGA</p>
              <h2 className="text-2xl font-semibold mt-1">
                {tab === "readings"
                  ? "Between the pages"
                  : tab === "bookmarks"
                    ? "Saved for later"
                    : "Thoughts after the last page"}
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                {tab === "readings"
                  ? "Pick up right where you left off."
                  : tab === "bookmarks"
                    ? "Your next great read is waiting here."
                    : "Stories worth talking about."}
              </p>
            </div>
            {tab === "reviews" && !reader && (
              <button
                className="action-primary"
                onClick={() =>
                  setDraft({
                    id:
                      catalog.find(
                        (m) => !state.reviews.some((r) => r.id === m.id),
                      )?.id || catalog[0].id,
                    rating: 5,
                    text: "",
                    date: new Date().toLocaleDateString("en-CA"),
                  })
                }
              >
                Write a review
              </button>
            )}
          </div>
          {tab !== "reviews" ? (
            <>
              <div className="flex gap-3 items-center">
                <input
                  className="library-input flex-1 min-w-0"
                  aria-label={`Search ${tab}`}
                  placeholder={`Search your ${tab}…`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {tab === "readings" && (
                  <div className="segmented">
                    {["All", "Reading", "Completed"].map((f) => (
                      <button
                        key={f}
                        aria-pressed={filter === f}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {list.length ? (
                <div className="manga-grid">
                  {list.map((m) => (
                    <div key={m.id}>
                      <MangaCard manga={m} />
                      {tab === "readings" && (
                        <div className="progress-block">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Chapter {readingProgress[m.id] ?? 1}</span>
                            <span>{m.recent_chapter}</span>
                          </div>
                          <progress
                            aria-label={`${m.title} reading progress`}
                            value={readingProgress[m.id] ?? 1}
                            max={Number(m.recent_chapter.replace(/\D/g, ""))}
                          />
                          {!reader && (
                            <label className="text-xs text-slate-400 flex items-center gap-2 mt-2">
                              Update chapter
                              <input
                                aria-label={`Chapter for ${m.title}`}
                                className="chapter-input"
                                type="number"
                                min="1"
                                max={Number(
                                  m.recent_chapter.replace(/\D/g, ""),
                                )}
                                value={state.progress[m.id] || 1}
                                onChange={(e) =>
                                  read(
                                    m.id,
                                    Math.min(
                                      Number(
                                        m.recent_chapter.replace(/\D/g, ""),
                                      ),
                                      Math.max(1, Number(e.target.value)),
                                    ),
                                  )
                                }
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  {query || filter !== "All"
                    ? "No titles match these filters."
                    : "Your shelf is ready for its first story."}
                  <Link
                    className="block text-orange-200 mt-3"
                    href="/home?tab=search"
                  >
                    Discover manga →
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.length ? (
                reviews.map((r) => {
                  const m = catalog.find((m) => m.id === r.id)!;
                  return (
                    <article key={r.id} className="review-card">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{m.title}</h3>
                          <div
                            className="flex items-center gap-1 text-orange-200 mt-2"
                            aria-label={`${r.rating} out of 5 stars`}
                          >
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < r.rating
                                    ? "fill-orange-200"
                                    : "text-slate-600"
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">{r.date}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-300 my-4 whitespace-pre-wrap">
                        {r.text}
                      </p>
                      {!reader && (
                        <div className="flex gap-3">
                          <button
                            className="text-xs text-slate-400 flex gap-1 items-center"
                            onClick={() => setDraft(r)}
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            className="text-xs text-slate-400 flex gap-1 items-center"
                            onClick={() => deleteReview(r.id)}
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <p className="empty-state">
                  No reviews yet. Share what you thought of your last read.
                </p>
              )}
            </div>
          )}
        </section>
      )}
      {connections && (
        <Modal onClose={() => setConnections(null)} aria-label={connections}>
          <div className="flex justify-between mb-5">
            <h2 className="text-xl capitalize">{connections}</h2>
            <button
              aria-label="Close connections"
              className="action-icon"
              onClick={() => setConnections(null)}
            >
              <X size={18} />
            </button>
          </div>
          <People
            usernames={
              connections === "followers"
                ? profile.followers
                : profile.following
            }
          />
        </Modal>
      )}
      {draft && (
        <Modal onClose={() => setDraft(null)} aria-label="Write a review">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveReview(draft);
              setDraft(null);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Your review</h2>
              <button
                type="button"
                aria-label="Close review editor"
                onClick={() => setDraft(null)}
              >
                <X size={18} />
              </button>
            </div>
            <label className="text-sm">
              Manga
              <select
                className="block w-full mt-2"
                value={draft.id}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              >
                {catalog.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Rating
              <select
                className="block mt-2"
                value={draft.rating}
                onChange={(e) =>
                  setDraft({ ...draft, rating: Number(e.target.value) })
                }
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} stars
                  </option>
                ))}
              </select>
            </label>
            <textarea
              required
              maxLength={2000}
              aria-label="Review text"
              placeholder="What stayed with you?"
              className="library-input min-h-32"
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            />
            <button className="action-primary" disabled={!draft.text.trim()}>
              Save review
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function PublicLibrary({ username }: { username: string }) {
  const load = useCallback(() => getUserProfile(username), [username]);
  const resource = useServiceResource(load);
  if (
    resource.error &&
    "status" in resource.error &&
    resource.error.status === 404
  ) {
    return (
      <section className="library-guest">
        <h1>Reader not found</h1>
        <Link href="/home?tab=search" className="auth-text-link">
          Search readers
        </Link>
      </section>
    );
  }
  if (!resource.data)
    return <ServiceNotice {...resource} label="Loading reader…" />;
  return <LibraryContent view={resource.data} isPublic />;
}
export default function Library() {
  const username = useAuthUsername();
  const { account } = useHome();
  const params = useSearchParams();
  const requestedUser = params.get("user");
  if (requestedUser && requestedUser !== username)
    return <PublicLibrary key={requestedUser} username={requestedUser} />;
  if (!username || !account) return <LibrarySignIn />;
  return <LibraryContent key={username} view={account} />;
}
