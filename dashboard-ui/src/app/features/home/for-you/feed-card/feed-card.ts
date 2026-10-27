import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
} from "@angular/core";
import type { MangaDetails } from "../../../../models/manga.model";
import { Icons, LucideDynamicIcon } from "../../../../shared/icons";
import { MangaActions } from "../../manga-actions/manga-actions";

@Component({
  selector: "manga-feed-card",
  host: { class: "contents" },
  imports: [MangaActions, LucideDynamicIcon, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./feed-card.html",
})
export class FeedCard {
  readonly details = input.required<MangaDetails>();
  readonly flipped = linkedSignal({
    source: () => this.details().id,
    computation: () => false,
  });
  readonly frontImage = computed(
    () => this.details().cover_url ?? this.details().panel?.image,
  );
  readonly frontDescription = computed(() =>
    this.details().cover_url
      ? `${this.details().title} cover`
      : (this.details().panel?.description ?? `${this.details().title} cover`),
  );
  readonly backImage = computed(
    () =>
      this.details().back_cover?.image ??
      this.details().panel?.image ??
      this.details().cover_url,
  );
  readonly rating = computed(
    () =>
      this.details().statistics?.rating.bayesian ??
      this.details().statistics?.rating.average ??
      null,
  );
  readonly statisticsDescription = computed(() => {
    const score = this.rating();
    return score === null
      ? "Not rated."
      : `Community rating ${score.toFixed(1)} out of 10.`;
  });
  readonly icons = Icons;
  private readonly injector = inject(Injector);
  private readonly frontButton =
    viewChild<ElementRef<HTMLButtonElement>>("frontButton");
  private readonly backButton =
    viewChild<ElementRef<HTMLButtonElement>>("backButton");
  get manga() {
    return this.details();
  }
  flip(showDetails: boolean) {
    this.flipped.set(showDetails);
    // Move keyboard focus to the visible face without moving the snap viewport.
    afterNextRender(
      () => {
        const button = this.flipped() ? this.backButton() : this.frontButton();
        button?.nativeElement.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
}
