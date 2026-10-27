import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { beforeEach, afterEach, vi } from "vitest";
import { navigation } from "./navigation-mocks";
import { ResizeObserverMock } from "./browser-mocks";

vi.mock("next/navigation", async () => {
  const { navigation, router } = await import("./navigation-mocks");
  return {
    useRouter: () => router,
    usePathname: () => navigation.pathname,
    useSearchParams: () => navigation.params,
  };
});

beforeEach(() => {
  navigation.pathname = "/home";
  navigation.params = new URLSearchParams();
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    HTMLElement.prototype.scrollTo = vi.fn();
  }
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
