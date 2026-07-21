"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { StarRating } from "@/components/StarRating";
import {
  fetchReviewsPage,
  fetchShopRatingSummary,
} from "@/lib/reviews";
import type { ProductReview } from "@/lib/types";

const PAGE_SIZE = 20;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [shopAverage, setShopAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const summary = await fetchShopRatingSummary();
        if (!cancelled) setShopAverage(summary.average);
      } catch {
        if (!cancelled) setShopAverage(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const { reviews: rows, total: count } = await fetchReviewsPage(
          page,
          PAGE_SIZE
        );
        if (!cancelled) {
          setReviews(rows);
          setTotal(count);
        }
      } catch {
        if (!cancelled) {
          setReviews([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <Reveal>
        <p className="eyebrow">Community</p>
        <h1 className="mt-3 font-display text-[2rem] font-medium text-ink sm:text-[2.4rem]">
          All reviews
        </h1>
        <p className="mt-2 text-[13px] text-ink/45">
          Consolidated feedback from every piece in the shop — highest rated
          first.
        </p>
        {shopAverage != null && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StarRating value={shopAverage} size={22} label="Shop rating" />
            <p className="font-display text-xl font-medium text-ink">
              {shopAverage.toFixed(1)}
            </p>
            <p className="text-[12px] text-ink/45">
              {total} review{total === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </Reveal>

      {loading ? (
        <p className="mt-12 text-[13px] text-ink/40">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="mt-12 border border-ink/10 bg-surface px-6 py-16 text-center">
          <p className="font-display text-2xl font-medium text-ink">
            No reviews yet
          </p>
          <p className="mt-2 text-[13px] text-ink/45">
            After a purchase, rate pieces from My Orders.
          </p>
          <Link href="/shop" className="btn-primary mt-8 inline-flex">
            Browse the Collection
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-10 divide-y divide-ink/8 border-y border-ink/10">
            {reviews.map((review) => (
              <li key={review.id} className="py-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <StarRating value={review.rating} size={14} />
                    <p className="mt-3 font-display text-lg font-medium text-ink">
                      {review.body?.trim()
                        ? `“${review.body.trim()}”`
                        : "Loved this piece."}
                    </p>
                    <p className="mt-2 text-[12px] text-ink/50">
                      <span className="font-medium text-ink/70">
                        {review.reviewerName}
                      </span>
                      {" · "}
                      <Link
                        href={`/product/${review.productId}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {review.productName}
                      </Link>
                    </p>
                  </div>
                  <time className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-ink/35">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-[10px] uppercase tracking-[0.2em] text-ink/45 disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-[10px] text-ink/35">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-[10px] uppercase tracking-[0.2em] text-ink/45 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
