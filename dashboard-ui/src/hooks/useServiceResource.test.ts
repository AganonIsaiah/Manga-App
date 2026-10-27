import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useServiceResource } from "./useServiceResource";

it("exposes loading, resolves data, and retries failures", async () => {
  const loader = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error("Unavailable"))
    .mockResolvedValue("Loaded");
  const { result } = renderHook(() => useServiceResource(loader));
  expect(result.current.loading).toBe(true);
  await waitFor(() =>
    expect(result.current.error?.message).toBe("Unavailable"),
  );
  act(() => result.current.retry());
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.data).toBe("Loaded"));
  expect(result.current.error).toBeNull();
});

it("does not replace a newer query's results with a late response", async () => {
  let resolveOld: (value: string) => void = () => {};
  const oldLoader = () =>
    new Promise<string>((resolve) => {
      resolveOld = resolve;
    });
  const newLoader = () => Promise.resolve("New results");
  const { result, rerender } = renderHook(
    ({ load }) => useServiceResource(load),
    { initialProps: { load: oldLoader } },
  );
  await act(async () => {});
  rerender({ load: newLoader });
  await waitFor(() => expect(result.current.data).toBe("New results"));
  await act(async () => {
    resolveOld("Old results");
  });
  expect(result.current.data).toBe("New results");
});

it("turns synchronous or non-Error failures into a retryable error", async () => {
  const load = () => {
    throw "not an Error";
  };
  const { result } = renderHook(() => useServiceResource<string>(load));
  await waitFor(() =>
    expect(result.current.error?.message).toBe(
      "Unable to load data. Please try again.",
    ),
  );
});
