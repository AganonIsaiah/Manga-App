"use client";
import { useCallback } from "react";
import { getReaders } from "../home.service";
import { useServiceResource } from "../../../hooks/useServiceResource";
import ServiceNotice from "./ServiceNotice";
import Link from "next/link";
import { useHome } from "../home.context";
import type { Reader } from "../home.types";
export function Person({ reader }: { reader: Reader }) {
  const { state, toggleFollow } = useHome();
  const followed = state.following.includes(reader.username);
  return (
    <article className="person-card">
      <Link
        href={`/home?tab=library&user=${reader.username}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="avatar" style={{ background: reader.color }}>
          {reader.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h3 className="font-medium">{reader.name}</h3>
          <p className="text-xs text-slate-400">@{reader.username}</p>
          <p className="mt-2 text-sm text-slate-400">{reader.bio}</p>
        </div>
      </Link>
      <button
        className={followed ? "action-secondary" : "action-primary"}
        aria-pressed={followed}
        onClick={() => toggleFollow(reader.username)}
      >
        {followed ? "Following" : "Follow"}
      </button>
    </article>
  );
}
export default function People({
  query = "",
  usernames,
}: {
  query?: string;
  usernames?: string[];
}) {
  const load = useCallback(
    () => getReaders({ query, usernames }),
    [query, usernames],
  );
  const resource = useServiceResource(load);
  if (!resource.data)
    return <ServiceNotice {...resource} label="Finding readers…" />;
  const matches = resource.data;
  return (
    <div className="flex flex-col gap-3">
      {matches.length ? (
        matches.map((r) => <Person key={r.username} reader={r} />)
      ) : (
        <p className="empty-state">
          No readers found. Try another name or username.
        </p>
      )}
    </div>
  );
}
