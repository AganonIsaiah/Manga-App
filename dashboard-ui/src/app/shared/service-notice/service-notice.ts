import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
@Component({
  selector: "manga-service-notice",
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./service-notice.html",
})
export class ServiceNotice {
  readonly error = input<Error | null>(null);
  readonly label = input("Loading…");
  readonly retry = output<void>();
}
