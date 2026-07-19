import Image from "next/image";
import { HangerIcon } from "./icons";

export function ProductImage({
  image,
  alt,
  className = "",
  priority = false,
}: {
  image: string | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (image && !image.startsWith("placeholder:")) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className="object-cover transition-transform duration-700 ease-out"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex h-full w-full items-center justify-center bg-brand-soft ${className}`}
    >
      <HangerIcon width={24} height={24} strokeWidth={1} className="text-ink/20" />
    </div>
  );
}
