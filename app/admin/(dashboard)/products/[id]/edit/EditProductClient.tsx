"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { fetchProductById } from "@/lib/api";
import type { Product } from "@/lib/types";

export function EditProductClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void (async () => {
      try {
        const row = await fetchProductById(id);
        if (!cancelled) setProduct(row);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!ready) {
    return (
      <p className="py-12 text-center text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
        Loading
      </p>
    );
  }

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
