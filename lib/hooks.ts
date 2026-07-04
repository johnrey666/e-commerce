"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useCatalogStore } from "./store/catalog-store";

const emptySubscribe = () => () => {};

/**
 * True after hydration on the client. Used to avoid hydration mismatches for
 * localStorage-backed state (cart count, persisted catalog, orders).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/** Catalog data plus a `ready` flag (seeded + safe to render on client). */
export function useCatalog() {
  const mounted = useMounted();
  const products = useCatalogStore((s) => s.products);
  const brands = useCatalogStore((s) => s.brands);
  const categories = useCatalogStore((s) => s.categories);
  const hydrated = useCatalogStore((s) => s.hydrated);
  const initialize = useCatalogStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return { products, brands, categories, ready: mounted && hydrated };
}
