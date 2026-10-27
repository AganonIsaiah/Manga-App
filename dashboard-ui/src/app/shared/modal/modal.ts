import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from "@angular/core";
@Component({
  selector: "dialog[mangaModal]",
  host: {
    class: "reader-dialog",
    "[attr.aria-label]": "label()",
    "(cancel)": "cancel($event)",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./modal.html",
})
export class Modal implements AfterViewInit {
  readonly label = input.required<string>();
  readonly dismissed = output<void>();
  private readonly element = inject<ElementRef<HTMLDialogElement>>(ElementRef);
  ngAfterViewInit() {
    this.element.nativeElement.showModal();
  }
  cancel(event: Event) {
    event.preventDefault();
    this.dismissed.emit();
  }
}
