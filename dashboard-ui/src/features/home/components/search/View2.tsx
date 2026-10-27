"use client";
import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { View2ListMangasProps } from "./search.types";
import { useHome } from "../../home.context";
import { getSearchFeed } from "../../home.service";
import { useServiceResource } from "../../../../hooks/useServiceResource";
import ServiceNotice from "../ServiceNotice";
import MangaCard from "../MangaCard";
import People from "../People";
export default function View2ListMangas({
  query,
  onBack,
}: View2ListMangasProps) {
  const [kind, setKind] = useState(query.startsWith("@") ? "users" : "manga");
  const [genre, setGenre] = useState("All genres");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState("Relevance");
  const { catalog } = useHome();
  const load = useCallback(
    () => getSearchFeed({ query, genre, status, sort }),
    [query, genre, status, sort],
  );
  const resource = useServiceResource(load);
  const matches = resource.data?.details ?? [];
  return (
    <section className="results-shell" aria-labelledby="results-title">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400"
      >
        <ArrowLeft size={16} />
        New search
      </button>
      <div>
        <p className="eyebrow">FIND YOUR NEXT OBSESSION</p>
        <h1 id="results-title" className="text-3xl font-semibold mt-2">
          Search results
        </h1>
        <p className="text-slate-400 mt-2 break-words">Exploring “{query}”</p>
      </div>
      <div className="segmented" aria-label="Result type">
        {["manga", "users"].map((k) => (
          <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k === "manga" ? "Manga" : "Readers"}
          </button>
        ))}
      </div>
      {kind === "users" ? (
        <People query={query} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filter by genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {["All genres", ...new Set(catalog.flatMap((m) => m.genres))].map(
                (g) => (
                  <option key={g}>{g}</option>
                ),
              )}
            </select>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["All statuses", "ongoing", "completed", "hiatus"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="Sort results"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {["Relevance", "Title A–Z", "Newest"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400" role="status">
            {resource.loading
              ? "Searching…"
              : `${matches.length} ${matches.length === 1 ? "story" : "stories"} found`}
          </p>
          {resource.loading || resource.error ? (
            <ServiceNotice {...resource} label="Searching manga…" />
          ) : matches.length ? (
            <div className="manga-grid">
              {matches.map((m) => (
                <MangaCard key={m.id} manga={m} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2 className="text-white font-medium mb-2">No stories found</h2>
              <p>Try a title, author, or a genre like fantasy or romance.</p>
              <button
                className="action-secondary mt-4"
                onClick={() => {
                  setGenre("All genres");
                  setStatus("All statuses");
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
