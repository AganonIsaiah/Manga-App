import { vi } from "vitest";
export const navigation = {
  pathname: "/home",
  params: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
};
export const router = {
  push: navigation.push,
  replace: navigation.replace,
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};
