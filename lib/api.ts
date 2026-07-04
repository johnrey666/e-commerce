import { seedBrands, seedCategories, seedProducts as rawSeedProducts } from "./seed-data";
import { assignProductImages } from "./sample-images";
import type { Brand, Category, Product } from "./types";

/**
 * Data-access layer.
 *
 * Everything below is async and returns copies of seed data so that swapping
 * in a real backend (Firebase/Firestore, Supabase, REST API...) only requires
 * changing these function bodies — no component rewrites.
 */

export async function fetchProducts(): Promise<Product[]> {
  return structuredClone(assignProductImages(rawSeedProducts));
}

export async function fetchBrands(): Promise<Brand[]> {
  return structuredClone(seedBrands);
}

export async function fetchCategories(): Promise<Category[]> {
  return structuredClone(seedCategories);
}
