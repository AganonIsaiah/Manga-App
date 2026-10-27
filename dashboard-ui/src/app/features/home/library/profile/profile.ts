import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import type { FavouritePanel } from "../../../../models/home.model";
import type { ProfileDetails } from "../../../../models/library.model";
import { Icons, LucideDynamicIcon } from "../../../../shared/icons";
import { Modal } from "../../../../shared/modal/modal";
@Component({
  selector: "manga-profile",
  host: { class: "contents" },
  imports: [LucideDynamicIcon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile.html",
})
export class Profile {
  readonly details = input.required<ProfileDetails>();
  readonly favouritePanels = input.required<FavouritePanel[]>();
  readonly readingMood = input.required<string>();
  readonly icons = Icons;
  readonly panel = signal<FavouritePanel | null>(null);
  readonly favourites = computed(() =>
    Object.values(this.details().favourite_manga),
  );
  readonly recent = computed(() => Object.values(this.details().recently_read));
  readonly counts = computed(() => {
    const r = this.details().ratings;
    return [r.one_star, r.two_stars, r.three_stars, r.four_stars, r.five_stars];
  });
  readonly maximum = computed(() => Math.max(...this.counts(), 1));
  cover(url: string) {
    return `url("${url}")`;
  }
}
