import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import goodcatchLogo from "@/lib/images/goodcatch.png";

const logo = goodcatchLogo as StaticImageData;

const HEIGHT = {
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72,
  header: 44,
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
      className={`inline-flex shrink-0 transition-opacity duration-300 hover:opacity-80 ${className}`}
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
    </Link>
  );
}
