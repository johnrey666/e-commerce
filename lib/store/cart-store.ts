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

const productQty = (items: CartItem[], productId: string) =>
  items
    .filter((i) => i.productId === productId)
    .reduce((sum, i) => sum + i.quantity, 0);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      addItem: (item, quantity = 1) =>
        set((s) => {
          const maxStock = Math.max(0, item.stock ?? 0);
          if (maxStock <= 0 || quantity <= 0) return s;

          const existing = s.items.find((i) =>
            sameLine(i, item.productId, item.size)
          );
          const room = Math.max(0, maxStock - productQty(s.items, item.productId));
          const toAdd = Math.min(quantity, room);
          if (toAdd <= 0) {
            // Refresh stock on the line if it's already at the cap.
            if (!existing) return s;
            return {
              items: s.items.map((i) =>
                sameLine(i, item.productId, item.size)
                  ? { ...i, stock: maxStock }
                  : i
              ),
            };
          }

          if (existing) {
            return {
              items: s.items.map((i) =>
                sameLine(i, item.productId, item.size)
                  ? {
                      ...i,
                      quantity: i.quantity + toAdd,
                      stock: maxStock,
                      unitPrice: item.unitPrice,
                      name: item.name,
                      image: item.image,
                    }
                  : i
              ),
            };
          }

          return {
            items: [...s.items, { ...item, stock: maxStock, quantity: toAdd }],
          };
        }),

      removeItem: (productId, size) =>
        set((s) => ({
          items: s.items.filter((i) => !sameLine(i, productId, size)),
        })),

      setQuantity: (productId, size, qty) =>
        set((s) => {
          if (qty <= 0) {
            return {
              items: s.items.filter((i) => !sameLine(i, productId, size)),
            };
          }

          const line = s.items.find((i) => sameLine(i, productId, size));
          if (!line) return s;

          const maxStock = Math.max(0, line.stock ?? line.quantity);
          const others = productQty(s.items, productId) - line.quantity;
          const maxForLine = Math.max(0, maxStock - others);
          const nextQty = Math.min(qty, maxForLine);
          if (nextQty <= 0) {
            return {
              items: s.items.filter((i) => !sameLine(i, productId, size)),
            };
          }

          return {
            items: s.items.map((i) =>
              sameLine(i, productId, size) ? { ...i, quantity: nextQty } : i
            ),
          };
        }),

      clear: () => set({ items: [] }),
    }),
    {
      name: "good-catch-cart",
      partialize: (s) => ({ items: s.items }),
      merge: (persisted, current) => {
        const raw = (persisted as Partial<CartState> | undefined)?.items ?? [];
        const items = raw.map((item) => {
          const stock =
            typeof item.stock === "number" && Number.isFinite(item.stock)
              ? Math.max(0, item.stock)
              : Math.max(1, item.quantity);
          return {
            ...item,
            stock,
            quantity: Math.min(Math.max(0, item.quantity), stock),
          };
        });

        const byProduct = new Map<string, CartItem[]>();
        for (const item of items) {
          const list = byProduct.get(item.productId) ?? [];
          list.push(item);
          byProduct.set(item.productId, list);
        }

        const clamped: CartItem[] = [];
        for (const lines of byProduct.values()) {
          const stock = Math.max(0, ...lines.map((l) => l.stock ?? 0));
          let remaining = stock;
          for (const line of lines) {
            const qty = Math.min(line.quantity, Math.max(0, remaining));
            remaining -= qty;
            if (qty > 0) clamped.push({ ...line, stock, quantity: qty });
          }
        }

        return {
          ...current,
          ...(typeof persisted === "object" && persisted ? persisted : {}),
          items: clamped,
        };
      },
    }
  )
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

/** How many more units of this product can still be added to the cart. */
export function cartRoomForProduct(
  items: CartItem[],
  productId: string,
  stock: number
): number {
  return Math.max(0, stock - productQty(items, productId));
}
