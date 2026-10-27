"use client";
import { useSyncExternalStore } from "react";
import { getSessionUsername, subscribeToSession } from "./auth.service";
const getServerSnapshot = () => null;
export function useAuthUsername() {
  return useSyncExternalStore(
    subscribeToSession,
    getSessionUsername,
    getServerSnapshot,
  );
}
