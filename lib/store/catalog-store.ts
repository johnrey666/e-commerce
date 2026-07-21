"use client";

import { create } from "zustand";
import {
  createBrand,
  createCategory,
  createProduct,
  fetchBrands,
  fetchCategories,
  fetchProducts,
  patchProduct,
  removeBrand,
  removeCategory,
  removeProduct,
  renameBrand,
  renameCategory,
} from "../api";
import { createClient } from "../supabase/client";
import type { Brand, Category, Product } from "../types";

interface CatalogState {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  hydrated: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  addProduct: (
    product: Omit<Product, "id" | "createdAt">
  ) => Promise<Product>;
  updateProduct: (
    id: string,
    patch: Partial<Omit<Product, "id" | "createdAt">>
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addBrand: (name: string) => Promise<void>;
  updateBrand: (id: string, name: string) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;

  addCategory: (name: string, parentId: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

function slugId(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `id-${Date.now()}`
  );
}

let initialization: Promise<void> | null = null;
let realtimeStarted = false;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRefresh(refresh: () => Promise<void>) {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void refresh();
  }, 400);
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  brands: [],
  categories: [],
  hydrated: false,
  error: null,

  refresh: async () => {
    try {
      const [products, brands, categories] = await Promise.all([
        fetchProducts(),
        fetchBrands(),
        fetchCategories(),
      ]);
      set({ products, brands, categories, hydrated: true, error: null });
    } catch (error) {
      set({
        hydrated: true,
        error:
          error instanceof Error ? error.message : "Could not load catalog.",
      });
    }
  },

  initialize: async () => {
    if (get().hydrated && !get().error) return;
    if (initialization) return initialization;

    initialization = get()
      .refresh()
      .then(() => {
        if (realtimeStarted || get().error) return;
        realtimeStarted = true;

        createClient()
          .channel("global-catalog")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "products" },
            () => scheduleRefresh(() => get().refresh())
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "brands" },
            () => scheduleRefresh(() => get().refresh())
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "categories" },
            () => scheduleRefresh(() => get().refresh())
          )
          .subscribe();
      })
      .finally(() => {
        initialization = null;
      });

    return initialization;
  },

  addProduct: async (data) => {
    const product = await createProduct(data);
    set((state) => ({ products: [product, ...state.products] }));
    return product;
  },

  updateProduct: async (id, patch) => {
    const product = await patchProduct(id, patch);
    set((state) => ({
      products: state.products.map((current) =>
        current.id === id ? product : current
      ),
    }));
  },

  deleteProduct: async (id) => {
    await removeProduct(id);
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    }));
  },

  addBrand: async (name) => {
    const brand = await createBrand({ id: slugId(name), name });
    set((state) => ({
      brands: [...state.brands, brand].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
  },

  updateBrand: async (id, name) => {
    await renameBrand(id, name);
    set((state) => ({
      brands: state.brands
        .map((brand) => (brand.id === id ? { ...brand, name } : brand))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  deleteBrand: async (id) => {
    await removeBrand(id);
    set((state) => ({
      brands: state.brands.filter((brand) => brand.id !== id),
    }));
  },

  addCategory: async (name, parentId) => {
    const category = await createCategory({
      id: `${parentId}-${slugId(name)}`,
      name,
      parentId,
    });
    set((state) => ({
      categories: [...state.categories, category].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
  },

  updateCategory: async (id, name) => {
    await renameCategory(id, name);
    set((state) => ({
      categories: state.categories
        .map((category) =>
          category.id === id ? { ...category, name } : category
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  deleteCategory: async (id) => {
    await removeCategory(id);
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
    }));
  },
}));
