"use client";
import Modal from "./Modal";
import { useState } from "react";
import { Bookmark, BookOpen, X } from "lucide-react";
import type { MangaDetails } from "./for-you/for-you-feed.types";
import { useHome } from "../home.context";
export function MangaActions({ manga }: { manga: MangaDetails }) {
  const { state, toggleBookmark, read } = useHome();
  const [open, setOpen] = useState(false);
  const saved = state.bookmarks.includes(manga.id);
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          className="action-primary flex-1"
          onClick={() => {
            if (read(manga.id)) setOpen(true);
          }}
        >
          <BookOpen size={15} />
          {state.progress[manga.id]
            ? `Continue · Ch. ${state.progress[manga.id]}`
            : "Start reading"}
        </button>
        <button
          className="action-icon"
          aria-label={`${saved ? "Remove bookmark for" : "Bookmark"} ${manga.title}`}
          aria-pressed={saved}
          onClick={() => toggleBookmark(manga.id)}
        >
          <Bookmark
            size={17}
            className={saved ? "fill-orange-300 text-orange-300" : ""}
          />
        </button>
      </div>
      {open && (
        <Modal
          onClose={() => setOpen(false)}
          aria-label={`${manga.title} preview`}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">{manga.title}</h2>
            <button
              className="action-icon"
              onClick={() => setOpen(false)}
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-slate-400 my-4">
            Reading preview · Chapter {state.progress[manga.id]}
          </p>
          <div className="preview-panel">
            <BookOpen size={36} />
            <p>Your next chapter awaits.</p>
            <p className="text-sm text-slate-400">
              This demo tracks your progress. Manga pages will be available when
              the reader service is connected.
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="action-secondary"
              disabled={state.progress[manga.id] <= 1}
              onClick={() =>
                read(manga.id, Math.max(1, state.progress[manga.id] - 1))
              }
            >
              Previous chapter
            </button>
            <button
              className="action-primary"
              disabled={
                state.progress[manga.id] >=
                Number(manga.recent_chapter.replace(/\D/g, ""))
              }
              onClick={() => read(manga.id, state.progress[manga.id] + 1)}
            >
              Next chapter
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export default function MangaCard({ manga }: { manga: MangaDetails }) {
  return (
    <article className="manga-card">
      <div
        className="cover-art"
        style={{ backgroundImage: `url("${manga.cover_url}")` }}
        role="img"
        aria-label={`${manga.title} cover`}
      >
        <span className="cover-status">{manga.status}</span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <h3 className="font-semibold text-sm">{manga.title}</h3>
        <p className="text-xs text-slate-400">{manga.authors.join(", ")}</p>
        <p className="text-xs text-orange-200">
          {manga.genres.slice(0, 2).join(" · ")}
        </p>
        <p className="text-xs text-slate-400 line-clamp-2">
          {manga.description}
        </p>
        <MangaActions manga={manga} />
      </div>
    </article>
  );
}
