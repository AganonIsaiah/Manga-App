import { DOCUMENT, Injectable, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

@Injectable({ providedIn: "root" })
export class BrowserStorage {
  private readonly document = inject(DOCUMENT);
  readonly window = isPlatformBrowser(inject(PLATFORM_ID))
    ? this.document.defaultView
    : null;
  read(
    key: string,
    scope: "localStorage" | "sessionStorage" = "localStorage",
  ): string | null {
    try {
      return this.window?.[scope].getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  write(
    key: string,
    value: string,
    scope: "localStorage" | "sessionStorage" = "localStorage",
  ): boolean {
    try {
      if (!this.window) return false;
      this.window[scope].setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  remove(
    key: string,
    scope: "localStorage" | "sessionStorage" = "localStorage",
  ): void {
    try {
      this.window?.[scope].removeItem(key);
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }
}
