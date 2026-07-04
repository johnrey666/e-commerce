import type { Product } from "./types";

export function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`;
}

export function effectivePrice(product: Product): number {
  return product.onSale && product.discountPrice != null
    ? product.discountPrice
    : product.price;
}

export function discountPercent(product: Product): number | null {
  if (!product.onSale || product.discountPrice == null) return null;
  return Math.round((1 - product.discountPrice / product.price) * 100);
}
