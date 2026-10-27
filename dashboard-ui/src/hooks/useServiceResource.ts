"use client";
import { useCallback, useEffect, useState } from "react";
export function useServiceResource<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    load: (() => Promise<T>) | null;
    attempt: number;
    data: T | null;
    error: Error | null;
  }>({ load: null, attempt: -1, data: null, error: null });
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(load)
      .then(
        (data) => {
          if (active) setResult({ load, attempt, data, error: null });
        },
        (cause) => {
          if (active)
            setResult({
              load,
              attempt,
              data: null,
              error:
                cause instanceof Error
                  ? cause
                  : new Error("Unable to load data. Please try again."),
            });
        },
      );
    return () => {
      active = false;
    };
  }, [load, attempt]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const loading = result.load !== load || result.attempt !== attempt;
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    retry,
  };
}
