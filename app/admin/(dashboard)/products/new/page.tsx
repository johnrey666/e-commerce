"use client";

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <p className="eyebrow">New Piece</p>
      <h1 className="mb-8 mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
        Add Product
      </h1>
      <ProductForm />
    </div>
  );
}
