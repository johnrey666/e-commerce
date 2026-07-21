"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { StarRating } from "@/components/StarRating";
import { fetchLandingReviews } from "@/lib/reviews";
import type { ProductReview } from "@/lib/types";

export function ReviewsPreview() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchLandingReviews(3);
        if (!cancelled) setReviews(rows);
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || reviews.length === 0) return null;

  return (
    <section className="border-t border-ink/8 bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <p className="eyebrow">From the Community</p>
            <h2 className="section-title mt-4">Shop reviews</h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-ink/45">
              Real notes from buyers across the collection.
            </p>
          </div>
        </Reveal>

        <ul className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {reviews.map((review, i) => (
            <Reveal key={review.id} delay={i * 0.06}>
              <li className="flex h-full flex-col border border-ink/10 bg-surface px-5 py-6">
                <StarRating value={review.rating} size={14} />
                <p className="mt-4 flex-1 font-display text-lg font-medium leading-snug text-ink">
                  {review.body?.trim()
                    ? `“${review.body.trim()}”`
                    : "Loved this piece."}
                </p>
                <div className="mt-5 border-t border-ink/8 pt-4">
                  <p className="text-[12px] font-medium text-ink">
                    {review.reviewerName}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-ink/40">
                    {review.productName}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            href="/reviews"
            className="inline-flex border border-ink/15 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.28em] text-ink/60 transition-colors hover:border-ink hover:text-ink"
          >
            View all reviews
          </Link>
        </div>
      </div>
    </section>
  );
}
