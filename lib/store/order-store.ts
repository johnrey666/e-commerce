"use client";

import { create } from "zustand";
import {
  fetchAllOrders,
  fetchMyOrders,
  updateOrderStatus as updateOrderStatusApi,
} from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/types";

interface OrderState {
  orders: Order[];
  loading: boolean;
  fetchOrders: (mode?: "mine" | "all") => Promise<void>;
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  setOrders: (orders: Order[]) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,

  setOrders: (orders) => set({ orders }),

  fetchOrders: async (mode = "all") => {
    set({ loading: true });
    try {
      const orders =
        mode === "mine" ? await fetchMyOrders() : await fetchAllOrders();
      set({ orders });
    } finally {
      set({ loading: false });
    }
  },

  updateStatus: async (orderId, status) => {
    const result = await updateOrderStatusApi(orderId, status);
    if (!result.ok) {
      console.warn("[orders] updateStatus:", result.error);
      return;
    }
    set({
      orders: get().orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
    });
  },
}));
