"use client";

import { useState } from "react";
import { StarRating } from "@/components/StarRating";
import { submitProductReview } from "@/lib/reviews";
import type { ProductReview } from "@/lib/types";

type OrderItemReviewProps = {
  orderId: string;
  productId: string;
  productName: string;
  reviewerName: string;
  existing?: ProductReview;
  onSaved: (review: ProductReview) => void;
  compact?: boolean;
};

export function OrderItemReview({
  orderId,
  productId,
  productName,
  reviewerName,
  existing,
  onSaved,
  compact = false,
}: OrderItemReviewProps) {
  const [saved, setSaved] = useState<ProductReview | undefined>(existing);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (rating < 1) {
      setError("Pick a star rating.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const review = await submitProductReview({
        orderId,
        productId,
        rating,
        body: body.trim() || undefined,
        productName,
        reviewerName,
      });
      setSaved(review);
      setEditing(false);
      onSaved(review);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save review.");
    } finally {
      setSaving(false);
    }
  };

  if (saved && !editing) {
    return (
      <div className={compact ? "mt-1.5" : "mt-2"}>
        <div className="flex items-center justify-between gap-2">
          <StarRating value={saved.rating} size={compact ? 12 : 14} />
          <button
            type="button"
            onClick={() => {
              setRating(saved.rating);
              setBody(saved.body ?? "");
              setEditing(true);
            }}
            className="text-[8px] font-medium uppercase tracking-[0.18em] text-ink/35 hover:text-ink"
          >
            Edit
          </button>
        </div>
        {saved.body ? (
          <p
            className={`mt-1 text-ink/55 ${compact ? "text-[10px] leading-snug" : "text-[12px] leading-relaxed"}`}
          >
            {saved.body}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`border-t border-ink/8 ${compact ? "mt-2 pt-2" : "mt-3 pt-3"}`}>
      <p className="text-[8px] font-medium uppercase tracking-[0.22em] text-ink/40">
        Rate this piece
      </p>
      <StarRating
        value={rating}
        onChange={setRating}
        size={compact ? 14 : 18}
        className="mt-1.5"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={compact ? 2 : 3}
        placeholder="Optional note…"
        className="mt-2 w-full resize-none border border-ink/12 bg-paper px-2.5 py-2 text-base leading-snug text-ink/80 outline-none placeholder:text-ink/30 focus:border-ink/35"
      />
      {error && <p className="mt-1 text-[11px] text-accent">{error}</p>}
      <div className="mt-2 flex gap-2">
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 border border-ink/12 py-2 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/45"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="flex-1 border border-ink/15 py-2 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/65 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
        >
          {saving ? "Saving…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
