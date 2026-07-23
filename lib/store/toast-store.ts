"use client";

import { create } from "zustand";

type ToastState = {
  message: string | null;
  /** Show a header snackbar for at least 2 seconds (default 2.5s). */
  show: (message: string, durationMs?: number) => void;
  clear: () => void;
};

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message, durationMs = 2500) => {
    if (timer) clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => {
      set({ message: null });
      timer = null;
    }, Math.max(2000, durationMs));
  },
  clear: () => {
    if (timer) clearTimeout(timer);
    timer = null;
    set({ message: null });
  },
}));
