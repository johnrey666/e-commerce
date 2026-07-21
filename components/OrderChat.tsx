"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "@/components/icons";
import {
  fetchOrderMessages,
  sendOrderMessage,
  uploadChatImage,
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const list = await fetchOrderMessages(orderId);
      if (!cancelled) setMessages(list);
    };
    void load();

    const supabase = createClient();
    const channel = supabase
      .channel(`order-chat-${orderId}-${crypto.randomUUID()}`)
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
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="border border-ink/10 bg-cream/40">
      <div className="border-b border-ink/10 px-4 py-3">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/55">
          Chat with {senderRole === "admin" ? "customer" : "seller"}
        </h3>
      </div>
      <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-[12px] text-ink/40">
            No messages yet. Say hello — or send a photo.
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
                  {m.imageUrl && (
                    <a
                      href={m.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="relative mb-2 block aspect-[4/3] w-full min-w-[10rem] overflow-hidden bg-black/10"
                    >
                      <Image
                        src={m.imageUrl}
                        alt="Chat attachment"
                        fill
                        sizes="240px"
                        className="object-cover"
                      />
                    </a>
                  )}
                  {m.body ? <p>{m.body}</p> : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {previewUrl && (
        <div className="flex items-center gap-3 border-t border-ink/8 px-3 pt-3">
          <div className="relative h-14 w-14 overflow-hidden border border-ink/10">
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
            className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/45"
          >
            Remove
          </button>
        </div>
      )}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-ink/10 p-3"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach photo"
          className="grid size-10 shrink-0 place-items-center border border-ink/15 text-ink/50"
        >
          <ImageIcon width={16} height={16} strokeWidth={1.5} />
        </button>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="input-field flex-1 !py-2.5 text-base"
        />
        <button
          type="submit"
          disabled={sending || (!body.trim() && !pendingFile)}
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
