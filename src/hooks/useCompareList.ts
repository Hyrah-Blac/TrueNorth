"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tnc:fleet-compare";
export const MAX_COMPARE_ITEMS = 4;

export interface CompareItem {
  slug: string;
  name: string;
  imageUrl?: string;
  categoryLabel: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function isCompareItem(value: unknown): value is CompareItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CompareItem).slug === "string" &&
    typeof (value as CompareItem).name === "string"
  );
}

function readStoredItems(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCompareItem) : [];
  } catch {
    return [];
  }
}

function writeStoredItems(items: CompareItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener());
}

/**
 * Small localStorage-backed store for the fleet comparison tray. Multiple
 * components (aircraft cards, the detail page, the floating tray) all read
 * and write the same list — a module-level listener set keeps them in sync
 * within a single tab, since native `storage` events only fire cross-tab.
 */
export function useCompareList() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setHydrated(true);

    const listener = () => setItems(readStoredItems());
    listeners.add(listener);

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) listener();
    }
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = useCallback((item: CompareItem) => {
    const current = readStoredItems();
    const exists = current.some((existing) => existing.slug === item.slug);
    const next = exists
      ? current.filter((existing) => existing.slug !== item.slug)
      : current.length >= MAX_COMPARE_ITEMS
        ? current
        : [...current, item];
    writeStoredItems(next);
  }, []);

  const remove = useCallback((slug: string) => {
    writeStoredItems(readStoredItems().filter((item) => item.slug !== slug));
  }, []);

  const clear = useCallback(() => {
    writeStoredItems([]);
  }, []);

  return {
    items,
    slugs: items.map((item) => item.slug),
    hydrated,
    isSelected: (slug: string) => items.some((item) => item.slug === slug),
    isFull: items.length >= MAX_COMPARE_ITEMS,
    toggle,
    remove,
    clear,
  };
}
