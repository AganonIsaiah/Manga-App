"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

import type { MangaDetails, ScrollerProps } from "./for-you-feed.types";
import { mockForYouFeed } from "../../home.api-mocks";

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
    <div className="primary-clr h-[50%] flex flex-col rounded-b">
      <div className="p-4 flex flex-col flex-1 gap-2 border-y border-slate-500 min-h-0">
        <div className="flex justify-between items-center">
          <div
            className="group relative w-[300px] cursor-pointer!"
            tabIndex={0}
          >
            <div className="truncate text-2xl font-semibold">{title}</div>

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

      <div className="px-2 h-[80px] flex items-center justify-center gap-3">
        <button className="orange-btn btn-transitions w-[70%] h-[40px] text-black py-2.5 rounded-md flex items-center justify-center gap-1.5">
          <BookOpen size={16} />
          <span className="font-medium text-sm">Start reading</span>
        </button>

        <button className="btn-transitions primary-border h-[40px] w-[40px] flex items-center justify-center rounded">
          <Bookmark size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
function ViewCard({ details }: { details: MangaDetails }) {
  const { cover_url, title } = details;
  return (
    <div className="home-view-card home-height flex flex-col rounded-lg">
      <div
        className="h-[50%] bg-slate-800 bg-cover bg-center"
        style={cover_url ? { backgroundImage: `url("${cover_url}")` } : undefined}
        role="img"
        aria-label={`${title} cover`}
      />

      <RenderMangaDetails details={details} />
    </div>
  );
}

function Scroller({
  activeIndex,
  length,
  onNext,
  onPrevious,
  onSelect,
}: ScrollerProps) {
  const pageStart = Math.floor(activeIndex / 5) * 5;
  const visibleIndexes = Array.from(
    { length: Math.min(5, length - pageStart) },
    (_, offset) => pageStart + offset,
  );

  return (
    <aside
      className="absolute top-1/2 left-[calc(50%+235px)] hidden w-16 -translate-y-1/2 flex-col items-center text-slate-400 sm:flex"
      aria-label="Recommendation scroller"
    >
      <button
        type="button"
        onClick={onPrevious}
        className="btn-transitions mb-5 rounded-full p-2 hover:text-white"
        aria-label="Previous recommendation"
      >
        <ChevronUp size={15} aria-hidden="true" />
      </button>

      <ol className="flex flex-col items-center gap-5">
        {visibleIndexes.map((index) => {
          const isActive = index === activeIndex;

          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                className={`btn-transitions min-w-10 font-medium tabular-nums ${
                  isActive
                    ? "text-3xl text-orange-300"
                    : "text-sm text-slate-400 hover:text-white"
                }`}
                aria-label={`Go to recommendation ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
              >
                {String(index + 1).padStart(2, "0")}
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={onNext}
        className="btn-transitions mt-5 rounded-full p-2 hover:text-white"
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
  const feedData = mockForYouFeed;

  const [itemHeight, setItemHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [loadedCount, setLoadedCount] = useState(feedData.details.length);

  const absoluteIndex = itemHeight > 0 ? Math.round(scrollTop / itemHeight) : 0;
  const activeIndex = absoluteIndex % feedData.details.length;

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

  // Keep every snap target mounted so long jumps can reach their destination.
  // Only the expensive card contents are virtualized.
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

    scrollContainer.scrollTo({
      top: index * itemHeight,
      behavior: "smooth",
    });
  }

  function handlePrevious() {
    scrollToAbsoluteIndex(Math.max(0, absoluteIndex - 1));
  }

  function handleNext() {
    const nextIndex = absoluteIndex + 1;

    if (nextIndex >= loadedCount) {
      setLoadedCount((currentCount) => currentCount + feedData.details.length);
      requestAnimationFrame(() => scrollToAbsoluteIndex(nextIndex));
      return;
    }

    scrollToAbsoluteIndex(nextIndex);
  }

  function handleSelect(index: number) {
    const cycleStart = absoluteIndex - activeIndex;
    const targetIndex = cycleStart + index;

    if (targetIndex >= loadedCount) {
      setLoadedCount((currentCount) => currentCount + feedData.details.length);
      requestAnimationFrame(() => scrollToAbsoluteIndex(targetIndex));
      return;
    }

    scrollToAbsoluteIndex(targetIndex);
  }

  if (feedData.details.length === 0) {
    return <p>No recommendations available.</p>;
  }

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative mx-auto h-full min-h-0 w-full snap-y snap-mandatory overflow-y-auto rounded-lg sm:max-w-[415px]"
        aria-label="Manga recommendations"
      >
        <div
          className="relative w-full"
          style={{ height: itemHeight * loadedCount }}
        >
          {loadedIndexes.map((itemIndex) => {
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
          activeIndex={activeIndex}
          length={feedData.details.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
