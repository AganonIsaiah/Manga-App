import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  linkedSignal,
} from "@angular/core";
import type { FavouritePanel } from "../../../../models/home.model";
import type { ProfileDetails } from "../../../../models/library.model";
import { Icons, LucideDynamicIcon } from "../../../../shared/icons";
import { PanelPicker } from "./panel-picker/panel-picker";
import { Modal } from "../../../../shared/modal/modal";
@Component({
  selector: "manga-profile",
  host: { class: "contents" },
  imports: [LucideDynamicIcon, Modal, PanelPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile.html",
})
export class Profile {
  readonly details = input.required<ProfileDetails>();
  readonly favouritePanels = input.required<FavouritePanel[]>();
  readonly readingMood = input.required<string>();
  readonly editable = input(false);
  readonly panelsAdded = output<FavouritePanel[]>();
  readonly panelRemoved = output<string>();
  readonly editorOpen = linkedSignal({
    source: () => this.details().username,
    computation: () => false,
  });
  readonly existingPanelIds = computed(() =>
    this.favouritePanels().map((panel) => panel.id),
  );
  readonly icons = Icons;
  readonly panel = linkedSignal({
    source: () => this.details().username,
    computation: (): FavouritePanel | null => null,
  });
  readonly favourites = computed(() =>
    Object.values(this.details().favourite_manga).slice(0, 4),
  );
  readonly recent = computed(() =>
    Object.values(this.details().recently_read).slice(0, 3),
  );
  readonly counts = computed(() => {
    const r = this.details().ratings;
    return [r.one_star, r.two_stars, r.three_stars, r.four_stars, r.five_stars];
  });
  readonly maximum = computed(() => Math.max(...this.counts(), 1));
  openEditor() {
    if (this.editable()) this.editorOpen.set(true);
  }
  addPanels(panels: FavouritePanel[]) {
    if (!this.editable() || !panels.length) return;
    this.panelsAdded.emit(panels);
    this.editorOpen.set(false);
  }
  removePanel(id: string) {
    if (!this.editable()) return;
    this.panelRemoved.emit(id);
    if (this.panel()?.id === id) this.panel.set(null);
  }
  cover(url: string) {
    return `url("${url}")`;
  }
}
