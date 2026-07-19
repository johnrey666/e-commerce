"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchBrands, fetchCategories, fetchProducts } from "../api";
import type { Brand, Category, Product } from "../types";

interface CatalogState {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  hydrated: boolean;
  initialize: () => Promise<void>;

  addProduct: (product: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addBrand: (name: string) => void;
  updateBrand: (id: string, name: string) => void;
  deleteBrand: (id: string) => void;

  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
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

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: [],
      brands: [],
      categories: [],
      hydrated: false,

      // Seeds the store on first visit; subsequent visits use persisted data.
      initialize: async () => {
        const state = get();
        if (state.brands.length === 0) {
          const [products, brands, categories] = await Promise.all([
            fetchProducts(),
            fetchBrands(),
            fetchCategories(),
          ]);
          set({ products, brands, categories, hydrated: true });
        } else {
          // Merge seed categories added after the store was first persisted.
          const seedCategories = await fetchCategories();
          const existing = new Set(state.categories.map((c) => c.id));
          const missing = seedCategories.filter((c) => !existing.has(c.id));
          set({
            categories:
              missing.length > 0
                ? [...missing, ...state.categories]
                : state.categories,
            hydrated: true,
          });
        }
      },

      addProduct: (data) => {
        const product: Product = {
          ...data,
          id: `p-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ products: [product, ...s.products] }));
        return product;
      },
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...patch, id } : p
          ),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addBrand: (name) =>
        set((s) => ({ brands: [...s.brands, { id: slugId(name), name }] })),
      updateBrand: (id, name) =>
        set((s) => ({
          brands: s.brands.map((b) => (b.id === id ? { ...b, name } : b)),
        })),
      deleteBrand: (id) =>
        set((s) => ({ brands: s.brands.filter((b) => b.id !== id) })),

      addCategory: (name) =>
        set((s) => ({
          categories: [...s.categories, { id: slugId(name), name }],
        })),
      updateCategory: (id, name) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
        })),
      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
    }),
    {
      // v4: sample products removed — catalog starts empty for real inventory.
      name: "good-catch-catalog-v4",
      partialize: (s) => ({
        products: s.products,
        brands: s.brands,
        categories: s.categories,
      }),
    }
  )
);
