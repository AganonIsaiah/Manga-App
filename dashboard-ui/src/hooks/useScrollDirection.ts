"use client";

import { useRef, useState, type UIEvent, type WheelEvent, type TouchEvent } from "react";

export function useScrollDirection(
  viewKey: string,
  threshold = 12,
  revealOnScrollUp = false,
) {
  const positions = useRef(new WeakMap<HTMLElement, {
    viewKey: string;
    previous: number;
    accumulated: number;
  }>());
  const [visibility, setVisibility] = useState({ viewKey, hidden: false });
  const touchY = useRef<number | null>(null);

  function setHidden(hidden: boolean) {
    setVisibility((previous) =>
      previous.viewKey === viewKey && previous.hidden === hidden
        ? previous
        : { viewKey, hidden }
    );
  }

  function hasScrollableContainer(target: EventTarget | null, root: HTMLElement) {
    let element = target instanceof Element ? target : null;
    while (element && root.contains(element)) {
      const overflow = getComputedStyle(element).overflowY;
      if (
        element.scrollHeight > element.clientHeight + 1 &&
        (overflow === "auto" || overflow === "scroll")
      ) return true;
      if (element === root) break;
      element = element.parentElement;
    }
    return false;
  }

  function onWheelCapture(event: WheelEvent<HTMLDivElement>) {
    if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (!hasScrollableContainer(event.target, event.currentTarget)) {
      setHidden(event.deltaY > 0);
    }
  }

  function onTouchStartCapture(event: TouchEvent<HTMLDivElement>) {
    touchY.current = event.touches.length === 1 ? event.touches[0].clientY : null;
  }

  function onTouchMoveCapture(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1 || touchY.current === null) return;
    const current = event.touches[0].clientY;
    const delta = touchY.current - current;
    if (Math.abs(delta) < 3) return;
    touchY.current = current;
    if (!hasScrollableContainer(event.target, event.currentTarget)) {
      setHidden(delta > 0);
    }
  }

  function onTouchEndCapture() {
    touchY.current = null;
  }

  function reveal() {
    setHidden(false);
  }

  function onScrollCapture(event: UIEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    // Captured scroll events can come from different nested containers.
    const current = Math.max(0, Math.min(target.scrollTop, target.scrollHeight - target.clientHeight));
    let position = positions.current.get(target);
    if (!position || position.viewKey !== viewKey) {
      position = { viewKey, previous: 0, accumulated: 0 };
      positions.current.set(target, position);
    }

    const delta = current - position.previous;
    position.previous = current;

    // Allow subpixel rounding, but only reveal once this scroller reaches the top.
    if (current <= 1) {
      position.accumulated = 0;
      reveal();
      return;
    }

    if (delta * position.accumulated < 0) position.accumulated = 0;
    position.accumulated += delta;

    if (position.accumulated >= threshold) {
      setHidden(true);
      position.accumulated = 0;
    } else if (revealOnScrollUp && position.accumulated <= -threshold) {
      reveal();
      position.accumulated = 0;
    }
  }

  return {
    hidden: visibility.viewKey === viewKey && visibility.hidden,
    onScrollCapture,
    onWheelCapture,
    onTouchStartCapture,
    onTouchMoveCapture,
    onTouchEndCapture,
    reveal,
  };
}
