"use client";

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Add product
      </h1>
      <ProductForm />
    </div>
  );
}
