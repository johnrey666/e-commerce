"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CheckoutDetails, Order, OrderStatus } from "../types";

interface OrderState {
  orders: Order[];
  placeOrder: (items: CartItem[], total: number, customer: CheckoutDetails) => Order;
  updateStatus: (orderId: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],

      placeOrder: (items, total, customer) => {
        const order: Order = {
          id: `GC-${Date.now().toString(36).toUpperCase()}`,
          items,
          total,
          customer,
          status: "Pending",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },

      updateStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),
    }),
    { name: "good-catch-orders" }
  )
);
