"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_LANDING_CONTENT,
  fetchLandingContent,
} from "./site-content";
import { useCatalogStore } from "./store/catalog-store";
import { createClient } from "./supabase/client";

const emptySubscribe = () => () => {};

/**
 * True after hydration on the client. Used to avoid hydration mismatches for
 * localStorage-backed state (cart count, orders).
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
  const error = useCatalogStore((s) => s.error);
  const initialize = useCatalogStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return {
    products,
    brands,
    categories,
    error,
    ready: mounted && hydrated,
  };
}

export function useLandingContent() {
  const [content, setContent] = useState(DEFAULT_LANDING_CONTENT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchLandingContent();
        if (!cancelled) setContent(next);
      } catch {
        if (!cancelled) setContent(DEFAULT_LANDING_CONTENT);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void load();

    // Unique channel per mount — HomePage + StoreInfo both call this hook;
    // a shared name throws after the first subscribe().
    const channel = supabase
      .channel(`landing-content-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_content",
          filter: "id=eq.landing",
        },
        () => {
          if (!cancelled) void load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { content, ready, setContent };
}
