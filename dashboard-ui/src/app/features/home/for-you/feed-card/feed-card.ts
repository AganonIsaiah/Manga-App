import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { MangaDetails } from "../../../../models/manga.model";
import { MangaActions } from "../../manga-actions/manga-actions";
@Component({
  selector: "manga-feed-card",
  host: { class: "contents" },
  imports: [MangaActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./feed-card.html",
})
export class FeedCard {
  readonly details = input.required<MangaDetails>();
  get manga() {
    return this.details();
  }
  readonly cover = computed(() => `url("${this.details().cover_url}")`);
}
