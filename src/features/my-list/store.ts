import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/config/analytics";

/**
 * My List and Recently Viewed, kept in localStorage against the anonymous
 * visitor (no account, no server copy, no IP). useSyncExternalStore keeps the
 * header counter, buttons and the list page in sync, across tabs too.
 */

const EVENT = "eboi:storage";
const MAX_LIST = 30;
const MAX_RECENT = 12;
const EMPTY: string[] = [];

function read(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // storage full or blocked: the feature quietly stops persisting
  }
  snapshots.delete(key);
  window.dispatchEvent(new Event(EVENT));
}

// Snapshots must be referentially stable between changes for useSyncExternalStore.
const snapshots = new Map<string, string[]>();
function snapshot(key: string): string[] {
  let s = snapshots.get(key);
  if (!s) {
    s = read(key);
    snapshots.set(key, s);
  }
  return s;
}

function subscribe(cb: () => void) {
  // Another tab changed storage: drop cached snapshots, then re-read.
  const onStorage = () => {
    snapshots.clear();
    cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMyList(): string[] {
  return useSyncExternalStore(subscribe, () => snapshot(STORAGE_KEYS.myList), () => EMPTY);
}

export function useRecent(): string[] {
  return useSyncExternalStore(subscribe, () => snapshot(STORAGE_KEYS.recent), () => EMPTY);
}

export function addToList(id: string) {
  const ids = read(STORAGE_KEYS.myList).filter((x) => x !== id);
  write(STORAGE_KEYS.myList, [id, ...ids].slice(0, MAX_LIST));
}

export function removeFromList(id: string) {
  write(
    STORAGE_KEYS.myList,
    read(STORAGE_KEYS.myList).filter((x) => x !== id),
  );
}

export function clearList() {
  write(STORAGE_KEYS.myList, []);
}

export function pushRecent(id: string) {
  const ids = read(STORAGE_KEYS.recent).filter((x) => x !== id);
  write(STORAGE_KEYS.recent, [id, ...ids].slice(0, MAX_RECENT));
}
