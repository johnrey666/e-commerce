import type { StaticImageData } from "next/image";
import sample1 from "./images/sample1.jpg";
import sample2 from "./images/sample2.jpg";
import sample3 from "./images/sample3.jpg";
import sample4 from "./images/sample4.jpg";
import sample5 from "./images/sample5.jpg";
import sample6 from "./images/sample6.jpg";
import sample7 from "./images/sample7.jpg";
import sample8 from "./images/sample8.jpg";
import sample9 from "./images/sample9.jpg";
import sample10 from "./images/sample10.jpg";
import type { Product } from "./types";

export const SAMPLE_IMAGES: StaticImageData[] = [
  sample1,
  sample2,
  sample3,
  sample4,
  sample5,
  sample6,
  sample7,
  sample8,
  sample9,
  sample10,
];

/** Public URL strings stored on product records (Next static import `.src`). */
export const SAMPLE_IMAGE_URLS = SAMPLE_IMAGES.map((img) => img.src);

/** Pick `count` sample URLs for product index `i` (cycles through all 10). */
export function productImages(productIndex: number, count = 1): string[] {
  const n = Math.max(count, 1);
  return Array.from({ length: n }, (_, j) =>
    SAMPLE_IMAGE_URLS[(productIndex + j) % SAMPLE_IMAGE_URLS.length]
  );
}

/** Replace placeholder refs on seed products with real sample photos. */
export function assignProductImages(products: Product[]): Product[] {
  return products.map((p, i) => ({
    ...p,
    images: productImages(i, p.images.length),
  }));
}

/** Scattered indices for decorative layouts (hero mosaic, etc.). */
export const SCATTER_INDICES = [0, 4, 1, 7, 2, 9, 3, 5, 6, 8, 0, 2, 5, 1, 8] as const;

export function scatteredSample(index: number): StaticImageData {
  return SAMPLE_IMAGES[SCATTER_INDICES[index % SCATTER_INDICES.length] % SAMPLE_IMAGES.length];
}
