"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { CloseIcon, ImageIcon } from "@/components/icons";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice } from "@/lib/format";
import {
  fetchOrderMessages,
  sendOrderMessage,
  uploadChatImage,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, OrderMessage, UserRole } from "@/lib/types";

export function OrderChatModal({
  open,
  onClose,
  orderId,
  orderLabel,
  orderItems = [],
  orderTotal,
  senderId,
  senderRole,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderLabel?: string;
  orderItems?: CartItem[];
  orderTotal?: number;
  senderId: string;
  senderRole: UserRole;
}) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [body, setBody] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cover = orderItems[0];

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
      .channel(`order-chat-modal-${orderId}-${crypto.randomUUID()}`)
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
            body: string | null;
            image_url: string | null;
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
                body: row.body?.trim() ?? "",
                imageUrl: row.image_url?.trim() || undefined,
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
      if (e.key === "Escape") {
        if (lightbox) setLightbox(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, lightbox]);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const clearPending = () => {
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !pendingFile) return;
    setSending(true);
    setError(null);

    let imageUrl: string | undefined;
    if (pendingFile) {
      const upload = await uploadChatImage(orderId, pendingFile);
      if (!upload.ok) {
        setSending(false);
        setError(upload.error);
        return;
      }
      imageUrl = upload.url;
    }

    const result = await sendOrderMessage({
      orderId,
      senderId,
      senderRole,
      body: body.trim() || undefined,
      imageUrl,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    clearPending();
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
          <header className="border-b border-ink/10 px-5 py-4 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">
                  {senderRole === "admin" ? "Customer chat" : "Seller chat"}
                </p>
                <h2 className="mt-1 truncate font-display text-xl font-medium text-ink">
                  {orderLabel ?? orderId}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close chat"
                className="grid size-10 shrink-0 place-items-center border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink"
              >
                <CloseIcon width={18} height={18} strokeWidth={1.5} />
              </button>
            </div>

            {cover && (
              <div className="mt-4 flex items-center gap-3 border border-ink/10 bg-surface p-2.5">
                <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-brand-soft">
                  {cover.image ? (
                    <ProductImage image={cover.image} alt={cover.name} />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {cover.name}
                    {orderItems.length > 1
                      ? ` +${orderItems.length - 1} more`
                      : ""}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-ink/45">
                    {orderItems
                      .map(
                        (i) =>
                          `${i.name}${i.size ? ` (${i.size})` : ""} ×${i.quantity}`
                      )
                      .join(" · ")}
                  </p>
                  {orderTotal != null && (
                    <p className="mt-0.5 text-[11px] font-medium text-ink/60">
                      {formatPrice(orderTotal)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-6 sm:px-8">
            {messages.length === 0 ? (
              <p className="text-center text-[13px] text-ink/40">
                No messages yet. Say hello — or send a packing photo.
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
                      {m.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setLightbox(m.imageUrl!)}
                          className="relative mb-2 block aspect-[4/3] w-full min-w-[12rem] overflow-hidden bg-black/10"
                        >
                          <Image
                            src={m.imageUrl}
                            alt="Chat attachment"
                            fill
                            sizes="320px"
                            className="object-cover"
                          />
                        </button>
                      )}
                      {m.body ? <p>{m.body}</p> : null}
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
            {previewUrl && (
              <div className="mx-auto mb-3 flex max-w-3xl items-start gap-3">
                <div className="relative h-20 w-20 overflow-hidden border border-ink/10 bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Attachment preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearPending}
                  className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/45 hover:text-ink"
                >
                  Remove photo
                </button>
              </div>
            )}
            <div className="mx-auto flex max-w-3xl items-center gap-2 sm:gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPendingFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Attach photo"
                className="grid size-11 shrink-0 place-items-center border border-ink/15 text-ink/55 transition-colors hover:border-ink hover:text-ink"
              >
                <ImageIcon width={18} height={18} strokeWidth={1.5} />
              </button>
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a message…"
                className="input-field flex-1 text-base"
              />
              <button
                type="submit"
                disabled={sending || (!body.trim() && !pendingFile)}
                className="btn-primary !px-5 disabled:opacity-50 sm:!px-6"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
            {error && (
              <p className="mx-auto mt-2 max-w-3xl text-[12px] font-medium text-brand">
                {error}
              </p>
            )}
          </form>

          <AnimatePresence>
            {lightbox && (
              <motion.div
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightbox(null)}
              >
                <button
                  type="button"
                  aria-label="Close image"
                  className="absolute right-4 top-4 grid size-10 place-items-center border border-white/30 text-white"
                  onClick={() => setLightbox(null)}
                >
                  <CloseIcon width={18} height={18} strokeWidth={1.5} />
                </button>
                <div
                  className="relative h-[min(80vh,720px)] w-full max-w-3xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={lightbox}
                    alt="Full size attachment"
                    fill
                    sizes="800px"
                    className="object-contain"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
