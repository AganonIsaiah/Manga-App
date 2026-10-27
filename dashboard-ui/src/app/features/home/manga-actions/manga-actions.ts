import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { HomeStore } from "../../../services/home-store/home-store.services";
import type { MangaDetails } from "../../../models/manga.model";
import { Icons, LucideDynamicIcon } from "../../../shared/icons";
import { Modal } from "../../../shared/modal/modal";
@Component({
  selector: "manga-actions",
  host: { class: "contents" },
  imports: [LucideDynamicIcon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./manga-actions.html",
})
export class MangaActions {
  readonly manga = input.required<MangaDetails>();
  readonly store = inject(HomeStore);
  readonly icons = Icons;
  readonly open = signal(false);
  readonly current = computed(
    () => this.store.state().progress[this.manga().id],
  );
  readonly saved = computed(() =>
    this.store.state().bookmarks.includes(this.manga().id),
  );
  readonly limit = computed(() =>
    Number(this.manga().recent_chapter.replace(/\D/g, "")),
  );
  start() {
    if (this.store.read(this.manga().id)) this.open.set(true);
  }
}
