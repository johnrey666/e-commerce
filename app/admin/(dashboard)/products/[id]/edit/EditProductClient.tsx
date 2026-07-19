"use client";

import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { useCatalog } from "@/lib/hooks";

export function EditProductClient({ id }: { id: string }) {
  const { products, ready } = useCatalog();

  if (!ready) {
    return (
      <p className="py-12 text-center text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
        Loading
      </p>
    );
  }

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl font-medium text-ink">
          Product not found
        </p>
        <Link
          href="/admin/products"
          className="btn-ghost mt-6 inline-flex justify-center"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Editing</p>
      <h1 className="mb-8 mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
        {product.name}
      </h1>
      <ProductForm product={product} />
    </div>
  );
}
