"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthUsername } from "../auth/useAuth";
import { useServiceResource } from "../../hooks/useServiceResource";
import { getHomeData, getUserProfile, saveUserLibrary } from "./home.service";
import { createEmptyLibrary, latestChapter } from "./library-state";
import type { HomeData, UserProfileData } from "./home.api-types";
import type { LibraryState, Review } from "./home.types";
import ServiceNotice from "./components/ServiceNotice";

type HomeContext = HomeData & {
  account: UserProfileData | null;
  state: LibraryState;
  toggleBookmark: (id: string) => boolean;
  toggleFollow: (id: string) => boolean;
  read: (id: string, chapter?: number) => boolean;
  saveReview: (review: Review) => boolean;
  deleteReview: (id: string) => boolean;
};
const Context = createContext<HomeContext | null>(null);
export function HomeProvider({ children }: { children: ReactNode }) {
  const username = useAuthUsername();
  const resource = useServiceResource(getHomeData);
  if (!resource.data)
    return <ServiceNotice {...resource} label="Loading home…" />;
  return username ? (
    <AccountLoader key={username} username={username} data={resource.data}>
      {children}
    </AccountLoader>
  ) : (
    <ResolvedHome
      key="guest"
      username={null}
      account={null}
      data={resource.data}
    >
      {children}
    </ResolvedHome>
  );
}
function AccountLoader({
  username,
  data,
  children,
}: {
  username: string;
  data: HomeData;
  children: ReactNode;
}) {
  const load = useCallback(() => getUserProfile(username), [username]);
  const resource = useServiceResource(load);
  if (!resource.data)
    return <ServiceNotice {...resource} label="Loading your library…" />;
  return (
    <ResolvedHome username={username} account={resource.data} data={data}>
      {children}
    </ResolvedHome>
  );
}
function ResolvedHome({
  username,
  account,
  data,
  children,
}: {
  username: string | null;
  account: UserProfileData | null;
  data: HomeData;
  children: ReactNode;
}) {
  const [state, setState] = useState<LibraryState>(
    () => account?.state ?? createEmptyLibrary(),
  );
  const [saveError, setSaveError] = useState<Error | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef(true);
  const previous = useRef(state);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const persist = useCallback(
    (snapshot: LibraryState) => {
      if (!username) return;
      // Serialize saves so a slow older request cannot overwrite newer changes.
      queue.current = queue.current
        .catch(() => {})
        .then(() => saveUserLibrary(username, snapshot))
        .then(
          () => {
            if (active.current) setSaveError(null);
          },
          (cause) => {
            if (active.current)
              setSaveError(
                cause instanceof Error
                  ? cause
                  : new Error("Unable to save changes. Please try again."),
              );
          },
        );
    },
    [username],
  );

  useEffect(() => {
    if (state === previous.current) return;
    previous.current = state;
    persist(state);
  }, [state, persist]);

  function requireSignIn() {
    if (username) return true;
    router.push(
      `/login?next=${encodeURIComponent(`${pathname}?${params.toString()}`)}`,
    );
    return false;
  }
  function toggle(key: "bookmarks" | "following", id: string) {
    if (!requireSignIn()) return false;
    setState((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((value) => value !== id)
        : [...current[key], id],
    }));
    return true;
  }
  return (
    <Context.Provider
      value={{
        ...data,
        account,
        state,
        toggleBookmark: (id) => toggle("bookmarks", id),
        toggleFollow: (id) => toggle("following", id),
        read: (id, chapter) => {
          if (!requireSignIn()) return false;
          setState((current) => ({
            ...current,
            progress: {
              ...current.progress,
              [id]: Math.min(
                latestChapter(id, data.catalog),
                Math.max(
                  1,
                  Math.trunc(chapter ?? current.progress[id] ?? 1) || 1,
                ),
              ),
            },
          }));
          return true;
        },
        saveReview: (review) => {
          if (!requireSignIn()) return false;
          setState((current) => ({
            ...current,
            reviews: [
              review,
              ...current.reviews.filter((value) => value.id !== review.id),
            ],
          }));
          return true;
        },
        deleteReview: (id) => {
          if (!requireSignIn()) return false;
          setState((current) => ({
            ...current,
            reviews: current.reviews.filter((review) => review.id !== id),
          }));
          return true;
        },
      }}
    >
      {saveError && (
        <div
          className="flex items-center gap-3 text-sm text-orange-200"
          role="alert"
        >
          <p>{saveError.message}</p>
          <button type="button" onClick={() => persist(state)}>
            Retry save
          </button>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function useHome() {
  const context = useContext(Context);
  if (!context) throw new Error("HomeProvider is required");
  return context;
}
