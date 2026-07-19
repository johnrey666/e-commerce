import { seedBrands, seedCategories } from "./seed-data";
import type { Brand, Category, Product } from "./types";

/**
 * Data-access layer.
 *
 * Everything below is async so that swapping in the Supabase backend only
 * requires changing these function bodies — no component rewrites.
 */

export async function fetchProducts(): Promise<Product[]> {
  // Catalog starts empty — real products are added via the admin dashboard.
  return [];
}

export async function fetchBrands(): Promise<Brand[]> {
  return structuredClone(seedBrands);
}

export async function fetchCategories(): Promise<Category[]> {
  return structuredClone(seedCategories);
}
