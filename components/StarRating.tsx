"use client";

import { StarIcon } from "@/components/icons";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
  /** Screen-reader label prefix */
  label?: string;
};

export function StarRating({
  value,
  onChange,
  size = 16,
  className = "",
  label = "Rating",
}: StarRatingProps) {
  const interactive = typeof onChange === "function";
  const clamped = Math.min(5, Math.max(0, value));

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={
        interactive ? label : `${label}: ${clamped} out of 5 stars`
      }
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= clamped;
        if (!interactive) {
          return (
            <StarIcon
              key={n}
              filled={filled}
              width={size}
              height={size}
              strokeWidth={1.4}
              className={filled ? "text-brand" : "text-ink/20"}
            />
          );
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === clamped}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <StarIcon
              filled={filled}
              width={size}
              height={size}
              strokeWidth={1.4}
              className={filled ? "text-brand" : "text-ink/25"}
            />
          </button>
        );
      })}
    </div>
  );
}
