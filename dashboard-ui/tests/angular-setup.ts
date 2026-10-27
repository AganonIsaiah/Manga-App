import { beforeEach, afterEach, vi } from "vitest";
import { ResizeObserverMock } from "./mock/browser-mocks";
import { authConfig } from "../src/app/config/auth.config";
import { apiConfig } from "../src/app/config/api.config";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  authConfig.useMocks = true;
  apiConfig.useMocks = true;
  apiConfig.baseUrl = "/api";
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
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
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
