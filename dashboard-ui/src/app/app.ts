import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "manga-root",
  imports: [RouterOutlet],
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app.html",
})
export class App {}
