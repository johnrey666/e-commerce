import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import goodcatchMark from "@/lib/images/goodcatch-mark.png";

const logo = goodcatchMark as StaticImageData;

/** Display heights — mark is ~3.7:1 so width scales with height. */
const HEIGHT = {
  sm: 28,
  md: 34,
  lg: 48,
  xl: 68,
  header: 32,
} as const;

export function Logo({
  className = "",
  size = "header",
  priority = false,
}: {
  className?: string;
  size?: keyof typeof HEIGHT;
  priority?: boolean;
}) {
  const h = HEIGHT[size];
  const w = Math.round(h * (logo.width / logo.height));

  return (
    <Link
      href="/"
      aria-label="Good Catch — home"
      className={`inline-flex shrink-0 flex-col items-center transition-opacity duration-300 hover:opacity-75 ${className}`}
    >
      <Image
        src={logo}
        alt="Good Catch"
        width={w}
        height={h}
        priority={priority}
        className="h-auto w-auto object-contain"
        style={{ height: h, width: "auto" }}
      />
      {(size === "lg" || size === "xl") && (
        <span className="mt-2.5 text-[8px] font-medium uppercase tracking-[0.5em] text-ink/40">
          Curated Vintage
        </span>
      )}
    </Link>
  );
}
