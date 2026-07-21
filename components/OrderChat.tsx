"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  fetchOrderMessages,
  sendOrderMessage,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import type { OrderMessage, UserRole } from "@/lib/types";

export function OrderChat({
  orderId,
  senderId,
  senderRole,
}: {
  orderId: string;
  senderId: string;
  senderRole: UserRole;
}) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const list = await fetchOrderMessages(orderId);
      if (!cancelled) setMessages(list);
    };
    void load();

    const supabase = createClient();
    const channel = supabase
      .channel(`order-chat-${orderId}`)
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
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="border border-ink/10 bg-cream/40">
      <div className="border-b border-ink/10 px-4 py-3">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/55">
          Chat with {senderRole === "admin" ? "customer" : "seller"}
        </h3>
      </div>
      <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-[12px] text-ink/40">
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
                  className={`max-w-[85%] px-3 py-2 text-[13px] leading-relaxed ${
                    mine
                      ? "bg-ink text-paper"
                      : "border border-ink/10 bg-surface text-ink"
                  }`}
                >
                  <p className="mb-1 text-[9px] uppercase tracking-[0.2em] opacity-60">
                    {m.senderRole === "admin" ? "Seller" : "You"}
                  </p>
                  <p>{m.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={onSubmit}
        className="flex gap-2 border-t border-ink/10 p-3"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="input-field flex-1 !py-2.5"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="bg-ink px-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {error && (
        <p className="px-4 pb-3 text-[12px] font-medium text-brand">{error}</p>
      )}
    </div>
  );
}
