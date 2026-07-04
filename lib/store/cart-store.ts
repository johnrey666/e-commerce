"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types";

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, size?: string) => void;
  setQuantity: (productId: string, size: string | undefined, qty: number) => void;
  clear: () => void;
}

const sameLine = (a: CartItem, productId: string, size?: string) =>
  a.productId === productId && a.size === size;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      addItem: (item, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) =>
            sameLine(i, item.productId, item.size)
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                sameLine(i, item.productId, item.size)
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity }] };
        }),

      removeItem: (productId, size) =>
        set((s) => ({
          items: s.items.filter((i) => !sameLine(i, productId, size)),
        })),

      setQuantity: (productId, size, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => !sameLine(i, productId, size))
              : s.items.map((i) =>
                  sameLine(i, productId, size) ? { ...i, quantity: qty } : i
                ),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "good-catch-cart",
      partialize: (s) => ({ items: s.items }),
    }
  )
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
