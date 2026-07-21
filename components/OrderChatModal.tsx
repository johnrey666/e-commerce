"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from "@/components/icons";
import {
  fetchOrderMessages,
  sendOrderMessage,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import type { OrderMessage, UserRole } from "@/lib/types";

export function OrderChatModal({
  open,
  onClose,
  orderId,
  orderLabel,
  senderId,
  senderRole,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderLabel?: string;
  senderId: string;
  senderRole: UserRole;
}) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      const list = await fetchOrderMessages(orderId);
      if (!cancelled) setMessages(list);
    };
    void load();

    const supabase = createClient();
    const channel = supabase
      .channel(`order-chat-modal-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            order_id: string;
            sender_id: string;
            sender_role: UserRole;
            body: string;
            created_at: string;
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                orderId: row.order_id,
                senderId: row.sender_id,
                senderRole: row.sender_role,
                body: row.body,
                createdAt: row.created_at,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [open, orderId]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    const result = await sendOrderMessage({
      orderId,
      senderId,
      senderRole,
      body,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    setMessages((prev) =>
      prev.some((m) => m.id === result.message.id)
        ? prev
        : [...prev, result.message]
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-paper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <header className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-8">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">
                {senderRole === "admin" ? "Customer chat" : "Seller chat"}
              </p>
              <h2 className="mt-1 font-display text-xl font-medium text-ink">
                {orderLabel ?? orderId}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="grid size-10 place-items-center border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink"
            >
              <CloseIcon width={18} height={18} strokeWidth={1.5} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-6 sm:px-8">
            {messages.length === 0 ? (
              <p className="text-center text-[13px] text-ink/40">
                No messages yet. Say hello.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === senderId;
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[min(85%,28rem)] px-4 py-3 text-[13px] leading-relaxed ${
                        mine
                          ? "bg-ink text-paper"
                          : "border border-ink/10 bg-surface text-ink"
                      }`}
                    >
                      <p className="mb-1 text-[9px] uppercase tracking-[0.2em] opacity-60">
                        {m.senderRole === "admin" ? "Seller" : "Customer"}
                      </p>
                      <p>{m.body}</p>
                      <p className="mt-2 text-[10px] opacity-40">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={onSubmit}
            className="border-t border-ink/10 bg-surface px-5 py-4 sm:px-8"
          >
            <div className="mx-auto flex max-w-3xl gap-3">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a message…"
                autoFocus
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="btn-primary !px-6 disabled:opacity-50"
              >
                Send
              </button>
            </div>
            {error && (
              <p className="mx-auto mt-2 max-w-3xl text-[12px] font-medium text-brand">
                {error}
              </p>
            )}
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
