"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookOpen } from "lucide-react";

import { MangaDetails } from "../home.types";
import { mockForYouFeed } from "../home.mock-api";

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

function ViewCard({ details }: { details: MangaDetails }) {
  const {
    title,
    genres,
    description,
    authors,
    artists,
    demographic,
    publicationYear,
    status,
    recentChapter,
    coverUrl,
  } = details;

  function MangaDetails() {
    const currentStatus = statusStyles[status];

    return (
      <div className="h-[55%] flex flex-col bg-gray-900  rounded-b">
        <div className="p-2 border-y border-slate-500">Cover</div>

        <div className="p-4 flex flex-col flex-1 gap-2 border-b border-slate-500 min-h-0">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-semibold">{title}</div>
            <div className="flex items-center justify-center gap-1">
              <span
                className={`${currentStatus.dot} w-2 h-2 rounded-full`}
              ></span>
              <span className={`text-sm font-medium ${currentStatus.text}`}>
                {currentStatus.label}
              </span>
            </div>
          </div>

          <div className="flex gap-3 text-xs text-secondary font-medium">
            <div>Story: {authors}</div>
            <div>Art: {artists}</div>
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

          <div className="text-sm overflow-y-auto overflow-x-hidden h-[calc(100vh-460px)]">
            {description}
          </div>
        </div>

        <div className="py-2 px-6 border-b border-slate-500 flex items-center justify-between text-sm">
          <div className="flex flex-col">
            <div className="text-gray-400">First published</div>
            <div className="font-medium">{publicationYear}</div>
          </div>

          <div className="flex flex-col">
            <div className="text-gray-400">Demographic</div>
            <div className="font-medium">{demographic}</div>
          </div>

          <div className="flex flex-col">
            <div className="text-gray-400">Latest Chapter</div>
            <div className="font-medium">{recentChapter}</div>
          </div>
        </div>

        <div className="px-2 h-[80px] flex items-center justify-center gap-3">
          <button className="w-[70%] h-[40px] orange-btn text-black py-2.5 rounded-md flex items-center justify-center gap-1.5">
            <BookOpen size={16} />
            <span className="font-medium text-sm">Start reading</span>
          </button>

          <button className="custom-border h-[40px] w-[40px] flex items-center justify-center rounded">
            <Bookmark size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-view-card home-height flex flex-col rounded-lg">
      <div className="h-[45%]"> image</div>

      <MangaDetails />
    </div>
  );
}

export default function ForYouFeed() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAddingItemsRef = useRef(false);
  const feedData = mockForYouFeed;

  const [itemHeight, setItemHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [loadedCount, setLoadedCount] = useState(feedData.details.length);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setItemHeight(entry.contentRect.height);
    });

    resizeObserver.observe(scrollContainer);

    return () => resizeObserver.disconnect();
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

  const visibleItems = useMemo(
    () =>
      Array.from(
        {
          length: Math.max(
            0,
            visibleRange.endIndex - visibleRange.startIndex + 1,
          ),
        },
        (_, offset) => visibleRange.startIndex + offset,
      ),
    [visibleRange],
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

  if (feedData.details.length === 0) {
    return <p>No recommendations available.</p>;
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative h-full min-h-0 w-full snap-y snap-mandatory overflow-y-auto rounded-lg"
        aria-label="Manga recommendations"
      >
        <div
          className="relative w-full"
          style={{ height: itemHeight * loadedCount }}
        >
          {visibleItems.map((itemIndex) => {
            const manga = feedData.details[itemIndex % feedData.details.length];

            return (
              <div
                key={`${manga.id}-${itemIndex}`}
                className="absolute left-0 flex w-full snap-start flex-col items-center justify-center gap-3"
                style={{
                  height: itemHeight,
                  transform: `translateY(${itemIndex * itemHeight}px)`,
                }}
              >
                <ViewCard details={manga} />
              </div>
            );
          })}
        </div>
      </div>
      <p className="font-medium text-sm text-gray-400">Scroll for next manga</p>
    </>
  );
}
