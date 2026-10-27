import { act, render, type RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
// Flush resolved service calls and any dependent providers before making assertions.
export async function renderService(element: ReactNode) {
  let result: RenderResult;
  await act(async () => {
    result = render(element);
  });
  return {
    ...result!,
    rerender: async (next: ReactNode) => {
      await act(async () => {
        result.rerender(next);
      });
    },
  };
}
