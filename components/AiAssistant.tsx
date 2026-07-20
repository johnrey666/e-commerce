"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCatalog } from "@/lib/hooks";
import { ChatIcon, CloseIcon } from "./icons";

const MAPS_LINK = "https://maps.app.goo.gl/WoB33D1QXzXSSpdH6";
const MAPS_LABEL = "Peñaranda St, Legazpi City, 4500 Albay";
/** Matches the place behind MAPS_LINK (LCC / Peñaranda St area). */
const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=13.1476805,123.7536253&z=16&output=embed";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  showMap?: boolean;
};

const SUGGESTIONS = [
  "Where are you located?",
  "What brands do you offer?",
  "Where can I contact you?",
] as const;

type Suggestion = (typeof SUGGESTIONS)[number];

function answerFor(
  question: Suggestion,
  brandNames: string[]
): Omit<ChatMessage, "id" | "role"> {
  switch (question) {
    case "Where are you located?":
      return {
        text: "We’re based in Legazpi, Philippines — by appointment for try-ons, with nationwide delivery for every order.",
        showMap: true,
      };
    case "What brands do you offer?":
      return {
        text:
          brandNames.length > 0
            ? `We currently carry: ${brandNames.join(", ")}. The edit changes often — check the shop for what’s available now.`
            : "We’re refreshing the brand list right now. Browse the shop to see what’s currently in stock.",
      };
    case "Where can I contact you?":
      return {
        text: "Reach us anytime at +63 917 000 0000, or message Good Catch on Facebook: facebook.com/goodcatch.ph",
      };
  }
}

function MapPreview({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="mt-3 space-y-2">
      <a
        href={MAPS_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:decoration-brand"
      >
        ({MAPS_LABEL})
      </a>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand map"
        className="group relative block w-full overflow-hidden border border-ink/10 bg-brand-faint text-left"
      >
        <iframe
          title="Store location map"
          src={MAP_EMBED_SRC}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="pointer-events-none h-36 w-full grayscale-[20%]"
        />
        <span className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.28em] text-paper/90 opacity-0 transition-opacity group-hover:opacity-100">
          Tap to expand
        </span>
      </button>
    </div>
  );
}

function MapModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="map-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="pointer-events-auto fixed inset-0 z-[60] bg-ink/45 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            key="map-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Store location map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto fixed inset-4 z-[70] mx-auto flex max-w-4xl flex-col overflow-hidden border border-ink/10 bg-paper sm:inset-8"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-ink">
                  Location
                </p>
                <a
                  href={MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-[12px] text-ink/55 transition-colors hover:text-brand"
                >
                  {MAPS_LABEL}
                </a>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close map"
                className="grid size-9 place-items-center text-ink/40 transition-colors hover:text-ink"
              >
                <CloseIcon width={16} height={16} strokeWidth={1.5} />
              </button>
            </div>
            <iframe
              title="Store location map expanded"
              src={MAP_EMBED_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-full min-h-0 w-full flex-1"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AiAssistant() {
  const { brands, ready } = useCatalog();
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Ask about location, brands, or how to reach us.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const brandNames = brands
    .map((b) => b.name)
    .sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mapOpen) setMapOpen(false);
      else setOpen(false);
    };
    if (open || mapOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mapOpen]);

  const ask = (question: Suggestion) => {
    if (busy) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: question },
    ]);
    setBusy(true);
    window.setTimeout(() => {
      const answer = answerFor(question, brandNames);
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: "bot", ...answer },
      ]);
      setBusy(false);
    }, 350);
  };

  return (
    <>
      <div className="pointer-events-none fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              role="dialog"
              aria-label="Store assistant"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex h-[min(26rem,68svh)] w-[min(20rem,calc(100vw-2rem))] flex-col border border-ink/10 bg-paper"
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-ink">
                  Ask us
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid size-8 place-items-center text-ink/40 transition-colors hover:text-ink"
                >
                  <CloseIcon width={15} height={15} strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {messages.map((m) => (
                  <div key={m.id}>
                    {m.role === "user" ? (
                      <p className="text-right text-[11px] font-medium uppercase tracking-[0.18em] text-ink/40">
                        {m.text}
                      </p>
                    ) : (
                      <div>
                        <p className="text-[13px] leading-relaxed text-ink/70">
                          {m.text}
                        </p>
                        {m.showMap && (
                          <MapPreview onExpand={() => setMapOpen(true)} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {busy && (
                  <p className="text-[11px] tracking-[0.12em] text-ink/30">…</p>
                )}
                <div ref={endRef} />
              </div>

              <div className="space-y-0 border-t border-ink/10">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={
                      busy || (q === "What brands do you offer?" && !ready)
                    }
                    onClick={() => ask(q)}
                    className="block w-full border-b border-ink/8 px-5 py-3 text-left text-[12px] text-ink/65 transition-colors last:border-b-0 hover:bg-brand-faint hover:text-ink disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          aria-label={open ? "Close assistant" : "Open assistant"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto grid size-11 place-items-center border border-ink/15 bg-paper text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
        >
          {open ? (
            <CloseIcon width={16} height={16} strokeWidth={1.5} />
          ) : (
            <ChatIcon width={16} height={16} strokeWidth={1.5} />
          )}
        </button>
      </div>

      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
    </>
  );
}
