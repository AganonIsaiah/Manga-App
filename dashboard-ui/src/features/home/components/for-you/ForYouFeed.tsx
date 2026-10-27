"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { MangaDetails, ScrollerProps } from "./for-you-feed.types";
import { useHome } from "../../home.context";

import { MangaActions } from "../MangaCard";

const statusStyles = {
  ongoing: {
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    label: "Ongoing",
  },
  completed: {
    dot: "bg-sky-400",
    text: "text-sky-300",
    label: "Completed",
  },
  hiatus: {
    dot: "bg-amber-400",
    text: "text-amber-300",
    label: "Hiatus",
  },
} as const;

function RenderMangaDetails({ details }: { details: MangaDetails }) {
  const {
    title,
    genres,
    description,
    authors,
    artists,
    demographic,
    publication_year,
    status,
    recent_chapter,
  } = details;
  const currentStatus = statusStyles[status];
  return (
    <div className="primary-clr min-h-0 flex-1 flex flex-col rounded-b">
      <div className="p-4 flex flex-col flex-1 gap-2 border-y border-slate-500 min-h-0">
        <div className="flex justify-between items-center">
          <div
            className="group relative min-w-0 flex-1 pr-3 cursor-pointer!"
            tabIndex={0}
          >
            <div className="truncate text-xl font-semibold">{title}</div>

            <div
              role="tooltip"
              className="cursor-pointer! absolute left-0 top-full z-50 mt-2
      hidden w-max max-w-[300px] rounded-md bg-slate-700
      px-3 py-2 text-sm font-normal text-white shadow-lg
      group-hover:block group-focus:block"
            >
              {title}
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.25">
            <span
              className={`${currentStatus.dot} w-2 h-2 rounded-full`}
            ></span>
            <span className={`text-xs font-medium ${currentStatus.text}`}>
              {currentStatus.label}
            </span>
          </div>
        </div>

        <div className="flex gap-3 text-xs text-secondary font-medium">
          <div>Story: {authors.join(", ")}</div>
          <div>Art: {artists.join(", ")}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre}
              className="rounded-md bg-gray-800 px-3 py-1 text-sm text-slate-400"
            >
              {genre}
            </span>
          ))}
        </div>

        <div className="text-sm text-slate-300 overflow-y-auto overflow-x-hidden min-h-12 flex-1 leading-relaxed">
          {description}
        </div>
      </div>

      <div className="py-2 px-3 border-b border-slate-500 flex items-center justify-between text-sm">
        <div className="flex flex-col">
          <div className="text-gray-400">First published</div>
          <div className="font-medium">{publication_year}</div>
        </div>

        <div className="flex flex-col">
          <div className="text-gray-400">Demographic</div>
          <div className="font-medium">{demographic}</div>
        </div>

        <div className="flex flex-col">
          <div className="text-gray-400">Latest Chapter</div>
          <div className="font-medium">{recent_chapter}</div>
        </div>
      </div>

      <div className="p-3"><MangaActions manga={details}/></div>
    </div>
  );
}

function ViewCard({ details }: { details: MangaDetails }) {
  const { cover_url, title } = details;
  return (
    <div className="home-view-card h-full flex flex-col rounded-lg my-3">
      <div
        className="h-[42%] shrink-0 bg-slate-800 bg-cover bg-center"
        style={cover_url ? { backgroundImage: `url("${cover_url}")` } : undefined}
        role="img"
        aria-label={`${title} cover`}
      />

      <RenderMangaDetails details={details} />
    </div>
  );
}

function Scroller({
  onNext,
  onPrevious,
}: ScrollerProps) {

  return (
    <aside
      className="absolute top-1/2 left-[calc(50%+205px)] hidden w-16 -translate-y-1/2 flex-col items-center text-slate-400 sm:flex"
      aria-label="Recommendation scroller"
    >
      <button
        type="button"
        onClick={onPrevious}
        className="btn-transitions mb-5 rounded-full p-2 hover:text-white hover:bg-slate-700"
        aria-label="Previous recommendation"
      >
        <ChevronUp size={15} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onNext}
        className="btn-transitions mt-5 rounded-full p-2 hover:text-white hover:bg-slate-700"
        aria-label="Next recommendation"
      >
        <ChevronDown size={15} aria-hidden="true" />
      </button>
    </aside>
  );
}

export default function ForYouFeed() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAddingItemsRef = useRef(false);
  const pendingIndexRef = useRef<number | null>(null);
  const itemHeightRef = useRef(0);
  const { recommendations } = useHome();
  const feedData = { details: recommendations };

  const [itemHeight, setItemHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [loadedCount, setLoadedCount] = useState(feedData.details.length);

  const absoluteIndex = itemHeight > 0 ? Math.round(scrollTop / itemHeight) : 0;

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) return;

    let settleTimer: number | undefined;
    const supportsScrollEnd = "onscrollend" in scrollContainer;

    function settleScroll() {
      const height = scrollContainer!.clientHeight || itemHeightRef.current;
      if (!height) return;
      window.clearTimeout(settleTimer);
      const index = pendingIndexRef.current ??
        Math.round(scrollContainer!.scrollTop / height);
      pendingIndexRef.current = null;
      const top = Math.max(0, index) * height;
      // A viewport resize can make the original pixel destination stale;
      // finish at the same card's new position.
      if (Math.abs(scrollContainer!.scrollTop - top) > 1) {
        scrollContainer!.scrollTo({ top, behavior: "instant" });
      }
    }

    function scheduleSettle() {
      if (supportsScrollEnd) return;
      window.clearTimeout(settleTimer);
      // Fallback for browsers without scrollend; also waits for resizing to stop.
      settleTimer = window.setTimeout(settleScroll, 120);
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      itemHeightRef.current = entry.contentRect.height;
      setItemHeight(entry.contentRect.height);
      scheduleSettle();
    });

    resizeObserver.observe(scrollContainer);
    scrollContainer.addEventListener("scroll", scheduleSettle);
    scrollContainer.addEventListener("scrollend", settleScroll);

    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(settleTimer);
      scrollContainer.removeEventListener("scroll", scheduleSettle);
      scrollContainer.removeEventListener("scrollend", settleScroll);
    };
  }, []);

  const visibleRange = useMemo(() => {
    if (itemHeight === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    const overscan = 2;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const endIndex = Math.min(
      loadedCount - 1,
      Math.ceil((scrollTop + itemHeight) / itemHeight) + overscan,
    );

    return { startIndex, endIndex };
  }, [itemHeight, loadedCount, scrollTop]);

  const loadedIndexes = useMemo(
    () => Array.from({ length: loadedCount }, (_, index) => index),
    [loadedCount],
  );

  function handleScroll() {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer || itemHeight === 0) return;

    setScrollTop(scrollContainer.scrollTop);

    const distanceFromBottom =
      scrollContainer.scrollHeight -
      scrollContainer.scrollTop -
      scrollContainer.clientHeight;

    if (distanceFromBottom <= itemHeight * 2 && !isAddingItemsRef.current) {
      isAddingItemsRef.current = true;
      setLoadedCount((currentCount) => currentCount + feedData.details.length);

      requestAnimationFrame(() => {
        isAddingItemsRef.current = false;
      });
    }
  }

  function scrollToAbsoluteIndex(index: number) {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer || itemHeight === 0) return;

    pendingIndexRef.current = index;
    scrollContainer.scrollTo({
      top: index * (scrollContainer.clientHeight || itemHeight),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  function handlePrevious() {
    scrollToAbsoluteIndex(Math.max(0, (pendingIndexRef.current ?? absoluteIndex) - 1));
  }

  function handleNext() {
    const nextIndex = (pendingIndexRef.current ?? absoluteIndex) + 1;

    if (nextIndex >= loadedCount) {
      setLoadedCount((currentCount) => currentCount + feedData.details.length);
      requestAnimationFrame(() => scrollToAbsoluteIndex(nextIndex));
      return;
    }

    scrollToAbsoluteIndex(nextIndex);
  }

  if (feedData.details.length === 0) {
    return <p>No recommendations available.</p>;
  }

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative mx-auto h-full min-h-0 w-full snap-y snap-mandatory overflow-y-auto scrollbar-none! rounded-lg sm:max-w-[415px]"
        aria-label="Manga recommendations"
        data-recommendation-feed
      >
        <div className="relative h-full w-full">
          {loadedIndexes.map((itemIndex) => {
            const manga = feedData.details[itemIndex % feedData.details.length];

            return (
              <div
                key={`${manga.id}-${itemIndex}`}
                className="relative flex h-full w-full shrink-0 snap-start flex-col items-center justify-center gap-3"
              >
                {itemIndex >= visibleRange.startIndex &&
                  itemIndex <= visibleRange.endIndex && (
                    <ViewCard details={manga} />
                  )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <Scroller
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}
