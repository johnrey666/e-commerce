import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import goodcatchLogo from "@/lib/images/goodcatch.png";

const logo = goodcatchLogo as StaticImageData;

const HEIGHT = {
  sm: 24,
  md: 30,
  lg: 40,
  xl: 56,
  header: 40,
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

  return (
    <Link
      href="/"
      aria-label="Good Catch — home"
      className={`inline-flex shrink-0 flex-col items-center transition-opacity duration-300 hover:opacity-75 ${className}`}
    >
      <Image
        src={logo}
        alt="Good Catch"
        width={logo.width}
        height={logo.height}
        priority={priority}
        className="w-auto object-contain"
        style={{ height: h }}
      />
      {(size === "lg" || size === "xl") && (
        <span className="mt-2.5 text-[8px] font-medium uppercase tracking-[0.5em] text-ink/40">
          Curated Vintage
        </span>
      )}
    </Link>
  );
}
