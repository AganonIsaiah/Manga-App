import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from "@angular/core";
import { Icons, LucideDynamicIcon } from "../icons";

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: "manga-searchable-select",
  imports: [LucideDynamicIcon],
  templateUrl: "./searchable-select.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchableSelect {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input("Search…");
  readonly options = input<readonly SelectOption[]>([]);
  readonly value = input("");
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly allowCustom = input(false);
  readonly selected = output<string>();
  readonly text = signal("");
  readonly open = signal(false);
  readonly active = signal(-1);
  readonly icons = Icons;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private fold(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }
  readonly matches = computed(() => {
    const query = this.fold(this.text());
    return this.options().filter(
      (option) =>
        this.fold(option.label).includes(query) ||
        this.fold(option.value) === query,
    );
  });
  readonly choices = computed(() => {
    const matches = this.matches().slice(0, 100);
    const text = this.text().trim();
    if (
      this.allowCustom() &&
      text &&
      !this.options().some(
        (option) => this.fold(option.label) === this.fold(text),
      )
    )
      return [
        { value: text, label: `Use “${text}”` },
        ...matches,
        { value: "", label: "Skip for now" },
      ];
    return [...matches, { value: "", label: "Skip for now" }];
  });
  constructor() {
    effect(() => {
      const value = this.value();
      this.text.set(
        untracked(
          () =>
            this.options().find((option) => option.value === value)?.label ??
            value,
        ),
      );
      this.active.set(-1);
    });
  }
  search(event: Event) {
    this.text.set((event.target as HTMLInputElement).value);
    this.open.set(true);
    this.active.set(-1);
  }
  show() {
    if (this.disabled()) return;
    // Opening a saved selection shows the full list until the user starts typing.
    this.text.set("");
    this.open.set(true);
    this.active.set(-1);
  }
  choose(value: string) {
    this.selected.emit(value);
    this.text.set(
      this.options().find((option) => option.value === value)?.label ?? value,
    );
    this.open.set(false);
    this.active.set(-1);
  }
  blur() {
    if (!this.open()) return;
    const text = this.text().trim();
    const exact = this.options().find(
      (option) => this.fold(option.label) === this.fold(text),
    );
    this.choose(
      exact?.value ?? (this.allowCustom() && text ? text : this.value()),
    );
  }
  keydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!this.open()) this.show();
      const count = this.choices().length;
      if (!count) return;
      const next =
        this.active() < 0
          ? event.key === "ArrowDown"
            ? 0
            : count - 1
          : this.active() + (event.key === "ArrowDown" ? 1 : -1);
      this.active.set((next + count) % count);
      this.element.nativeElement
        .querySelector(`#${this.inputId()}-option-${this.active()}`)
        ?.scrollIntoView?.({ block: "nearest" });
    } else if (event.key === "Enter" && this.open()) {
      event.preventDefault();
      const option = this.choices()[this.active() >= 0 ? this.active() : 0];
      if (option) this.choose(option.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.open.set(false);
      this.text.set(
        this.options().find((option) => option.value === this.value())?.label ??
          this.value(),
      );
    }
  }
}
