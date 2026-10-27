import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { MangaDetails } from "../../../models/manga.model";
import { MangaActions } from "../manga-actions/manga-actions";
@Component({
  selector: "article[mangaCard]",
  host: { class: "manga-card" },
  imports: [MangaActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./manga-card.html",
})
export class MangaCard {
  readonly manga = input.required<MangaDetails>();
  readonly cover = computed(() => `url("${this.manga().cover_url}")`);
}
