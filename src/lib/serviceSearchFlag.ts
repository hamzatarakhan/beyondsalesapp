// Feature flag for the Home/Services search bar. It stays hidden for dealers until the PM
// approves it: Settings has a toggle that needs a password to turn on (a prototype gate only,
// not real security). Stored per device in localStorage, off by default.
import { useSyncExternalStore } from "react";

const KEY = "feature-service-search";
export const SERVICE_SEARCH_PASSWORD = "321";

const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const setServiceSearchEnabled = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // storage blocked — the toggle just won't persist
  }
  listeners.forEach((l) => l());
};

export const useServiceSearchEnabled = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => false,
  );
