import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { HomeStore } from "../../../services/home-store/home-store.services";
import { FeedCard } from "./feed-card/feed-card";
import { Icons, LucideDynamicIcon } from "../../../shared/icons";
@Component({
  selector: "manga-feed",
  host: { class: "relative h-full min-h-0 w-full" },
  imports: [FeedCard, LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./for-you.html",
})
export class ForYou implements AfterViewInit {
  readonly store = inject(HomeStore);
  readonly icons = Icons;
  readonly items = computed(() => this.store.data()?.recommendations ?? []);
  readonly scroller = viewChild<ElementRef<HTMLDivElement>>("scroller");
  readonly height = signal(0);
  readonly top = signal(0);
  readonly count = signal(0);
  readonly indexes = computed(() =>
    Array.from({ length: this.count() || this.items().length }, (_, i) => i),
  );
  private pending: number | null = null;
  private adding = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly destroy = inject(DestroyRef);
  visible(index: number) {
    const h = this.height();
    return !h
      ? index === 0
      : index >= Math.max(0, Math.floor(this.top() / h) - 2) &&
          index <= Math.ceil((this.top() + h) / h) + 2;
  }
  ngAfterViewInit() {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    const settle = () => {
      const height = el.clientHeight || this.height();
      if (!height) return;
      clearTimeout(this.timer);
      const index = this.pending ?? Math.round(el.scrollTop / height);
      this.pending = null;
      // Resize may invalidate a smooth scroll’s original pixel destination.
      const top = Math.max(0, index) * height;
      if (Math.abs(el.scrollTop - top) > 1)
        el.scrollTo({ top, behavior: "instant" });
    };
    const schedule = () => {
      if ("onscrollend" in el) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(settle, 120);
    };
    const observer = new ResizeObserver(([entry]) => {
      this.height.set(entry.contentRect.height);
      schedule();
    });
    observer.observe(el);
    el.addEventListener("scroll", schedule);
    el.addEventListener("scrollend", settle);
    this.destroy.onDestroy(() => {
      observer.disconnect();
      clearTimeout(this.timer);
      el.removeEventListener("scroll", schedule);
      el.removeEventListener("scrollend", settle);
    });
  }
  onScroll() {
    const el = this.scroller()?.nativeElement;
    if (!el || !this.height()) return;
    this.top.set(el.scrollTop);
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight <= this.height() * 2 &&
      !this.adding
    ) {
      this.adding = true;
      this.count.set(this.indexes().length + this.items().length);
      requestAnimationFrame(() => (this.adding = false));
    }
  }
  move(direction: number) {
    const el = this.scroller()?.nativeElement;
    if (!el || !this.height()) return;
    const index = Math.max(
      0,
      (this.pending ?? Math.round(this.top() / this.height())) + direction,
    );
    const scroll = () => {
      this.pending = index;
      el.scrollTo({
        top: index * (el.clientHeight || this.height()),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };
    if (index >= this.indexes().length) {
      this.count.set(this.indexes().length + this.items().length);
      requestAnimationFrame(scroll);
    } else scroll();
  }
}
