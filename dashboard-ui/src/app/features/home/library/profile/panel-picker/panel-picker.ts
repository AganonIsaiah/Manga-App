import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Subscription, defer, finalize } from "rxjs";
import { HomeApi } from "../../../../../services/home/home.services";
import type { FavouritePanel } from "../../../../../models/home.model";
import { Icons, LucideDynamicIcon } from "../../../../../shared/icons";
import { ServiceNotice } from "../../../../../shared/service-notice/service-notice";

@Component({
  selector: "manga-panel-picker",
  host: { class: "contents" },
  imports: [FormsModule, LucideDynamicIcon, ServiceNotice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./panel-picker.html",
})
export class PanelPicker {
  readonly existingIds = input<string[]>([]);
  readonly added = output<FavouritePanel[]>();
  readonly icons = Icons;
  private readonly api = inject(HomeApi);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private readonly choicesValue = signal<FavouritePanel[]>([]);
  readonly choices = this.choicesValue.asReadonly();
  readonly query = signal("");
  readonly selectedIds = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal<Error | null>(null);
  readonly visible = computed(() =>
    this.choices().filter((panel) =>
      panel.title.toLowerCase().includes(this.query().trim().toLowerCase()),
    ),
  );
  readonly selected = computed(() =>
    this.choices().filter(
      (panel) =>
        this.selectedIds().includes(panel.id) &&
        !this.existingIds().includes(panel.id),
    ),
  );
  constructor() {
    this.load();
  }
  load() {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = defer(() => this.api.getPanelSuggestions())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (choices) => this.choicesValue.set(choices),
        error: (error) =>
          this.error.set(
            error instanceof Error
              ? error
              : new Error("Unable to load panels."),
          ),
      });
  }
  toggle(id: string) {
    if (this.existingIds().includes(id)) return;
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    );
  }
  add() {
    if (this.selected().length) this.added.emit(this.selected());
  }
}
