import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { HomeStore } from "../../services/home-store.services";
import { Icons, LucideDynamicIcon } from "../../shared/icons";
import { ServiceNotice } from "../../shared/service-notice/service-notice";
import { ForYou } from "./for-you/for-you";
import { Search } from "./search/search";
import { Library } from "./library/library";
@Component({
  selector: "manga-home",
  host: { class: "contents" },
  imports: [
    RouterLink,
    LucideDynamicIcon,
    ServiceNotice,
    ForYou,
    Search,
    Library,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./home.html",
})
export class Home {
  readonly store = inject(HomeStore);
  readonly icons = Icons;
  private readonly route = inject(ActivatedRoute);
  readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly tab = computed(() => {
    const tab = this.query().get("tab");
    return tab === "library" || tab === "search" ? tab : "discovery";
  });
  readonly navigation = [
    { tab: "library", label: "Library", icon: Icons.Library },
    { tab: "search", label: "Search", icon: Icons.Search },
    { tab: "discovery", label: "For you", icon: Icons.Compass },
  ];
  params(tab: string) {
    return tab === "library" && !this.store.auth.username()
      ? { next: "/home?tab=library" }
      : { ...this.route.snapshot.queryParams, tab, user: null };
  }
  retry() {
    if (this.store.homeError()) void this.store.loadHome();
    else void this.store.loadAccount(this.store.auth.username());
  }
}
