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
    const load = async () => {
      try {
        setContent(await fetchLandingContent());
      } catch {
        setContent(DEFAULT_LANDING_CONTENT);
      } finally {
        setReady(true);
      }
    };

    void load();
    const channel = supabase
      .channel("landing-content")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_content",
          filter: "id=eq.landing",
        },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return { content, ready, setContent };
}
