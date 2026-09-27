"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookOpen } from "lucide-react";

import { MangaDetails } from "../home.types";
import { mockForYouFeed } from "../home.mock-api";

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
    return (
      <div className="h-[45%] flex flex-col bg-slate-700">
        <div className="p-2 border-b border-slate-500">Cover</div>

        <div className="p-2 flex flex-col border-b border-slate-500">
          <div className="flex justify-between">
            <div className="text-xl">{title}</div>
            <div>{status}</div>
          </div>

          <div className="flex gap-3">
            <div>Story: {authors}</div>
            <div>Art: {artists}</div>
          </div>

          <div className="">{genres}</div>

          <div>{description}</div>
        </div>

        <div className="p-2 border-b border-slate-500 flex items-center justify-between">
          <div className="flex flex-col">
            <div>First published</div>
            <div>{publicationYear}</div>
          </div>

          <div className="flex flex-col">
            <div>Demographic</div>
            <div>{demographic}</div>
          </div>

          <div className="flex flex-col">
            <div>Latest Chapter</div>
            <div>{recentChapter}</div>
          </div>
        </div>

        <div className="px-2 flex items-center justify-center flex-1">
          <button className="w-[70%] orange-btn text-black py-2.5 rounded-md flex items-center justify-center gap-1.5">
            <BookOpen size={16}/>
            <span className="font-medium text-sm">Start reading</span>
          </button>

          <button className="">
            <Bookmark />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-view-card flex flex-col">
      <div className="h-[55%]"> image</div>

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
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="relative h-full min-h-0 w-full snap-y snap-mandatory overflow-y-auto"
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
              <p>Scroll for next manga</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
