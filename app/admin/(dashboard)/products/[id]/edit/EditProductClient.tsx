"use client";

import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { useCatalog } from "@/lib/hooks";

export function EditProductClient({ id }: { id: string }) {
  const { products, ready } = useCatalog();

  if (!ready) {
    return <p className="py-12 text-center text-sm text-muted">Loading…</p>;
  }

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="py-12 text-center">
        <p className="font-display text-lg font-bold">Product not found</p>
        <Link
          href="/admin/products"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Edit: {product.name}
      </h1>
      <ProductForm product={product} />
    </div>
  );
}
