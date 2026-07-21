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

function StarFill({
  fill,
  size,
  mutedClass,
}: {
  fill: number;
  size: number;
  mutedClass: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, fill)) * 100);

  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <StarIcon
        filled={false}
        width={size}
        height={size}
        strokeWidth={1.4}
        className={`absolute inset-0 ${mutedClass}`}
      />
      {pct > 0 && (
        <span
          className="absolute inset-0 overflow-hidden text-brand"
          style={{ width: `${pct}%` }}
        >
          <StarIcon
            filled
            width={size}
            height={size}
            strokeWidth={1.4}
            className="block max-w-none"
          />
        </span>
      )}
    </span>
  );
}

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
        interactive
          ? label
          : `${label}: ${clamped.toFixed(1)} out of 5 stars`
      }
    >
      {[1, 2, 3, 4, 5].map((n) => {
        if (!interactive) {
          const fill = Math.min(1, Math.max(0, clamped - (n - 1)));
          return (
            <StarFill
              key={n}
              fill={fill}
              size={size}
              mutedClass="text-ink/20"
            />
          );
        }
        const filled = n <= Math.round(clamped);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === Math.round(clamped)}
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
