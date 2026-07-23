"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "@/lib/store/toast-store";

/** Slim success banner that slides in under the top of the viewport. */
export function HeaderSnackbar() {
  const message = useToastStore((s) => s.message);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed inset-x-0 top-0 z-[90] border-b border-ink/10 bg-ink text-paper"
        >
          <div className="mx-auto flex max-w-[90rem] items-center justify-center px-5 py-3.5 sm:px-10">
            <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em]">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
