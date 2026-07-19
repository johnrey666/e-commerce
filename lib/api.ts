import { createClient } from "./supabase/client";
import type { Brand, Category, Product } from "./types";

/**
 * Supabase-backed catalog data access. Products, brands, and categories are
 * global; every browser reads and writes the same rows.
 */

interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  on_sale: boolean;
  is_new_arrival: boolean;
  category_id: string;
  brand_id: string;
  condition: Product["condition"];
  images: string[];
  sizes: string[];
  stock: number;
  tags: string[];
  created_at: string;
}

type ProductInput = Omit<Product, "id" | "createdAt">;

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    discountPrice:
      row.discount_price == null ? undefined : Number(row.discount_price),
    onSale: row.on_sale,
    isNewArrival: row.is_new_arrival,
    categoryId: row.category_id,
    brandId: row.brand_id,
    condition: row.condition,
    images: row.images ?? [],
    sizes: row.sizes ?? [],
    stock: row.stock,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

function productPayload(product: ProductInput | Partial<ProductInput>) {
  const payload: Record<string, unknown> = {};

  if (product.name !== undefined) payload.name = product.name;
  if (product.description !== undefined) payload.description = product.description;
  if (product.price !== undefined) payload.price = product.price;
  if ("discountPrice" in product) {
    payload.discount_price = product.discountPrice ?? null;
  }
  if (product.onSale !== undefined) payload.on_sale = product.onSale;
  if (product.isNewArrival !== undefined) {
    payload.is_new_arrival = product.isNewArrival;
  }
  if (product.categoryId !== undefined) payload.category_id = product.categoryId;
  if (product.brandId !== undefined) payload.brand_id = product.brandId;
  if (product.condition !== undefined) payload.condition = product.condition;
  if (product.images !== undefined) payload.images = product.images;
  if (product.sizes !== undefined) payload.sizes = product.sizes;
  if (product.stock !== undefined) payload.stock = product.stock;
  if (product.tags !== undefined) payload.tags = product.tags;

  return payload;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await createClient()
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ProductRow[]).map(mapProduct);
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await createClient()
    .from("brands")
    .select("id, name")
    .order("name");

  if (error) throw new Error(error.message);
  return data as Brand[];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await createClient()
    .from("categories")
    .select("id, name")
    .order("name");

  if (error) throw new Error(error.message);
  return data as Category[];
}

export async function createProduct(product: ProductInput): Promise<Product> {
  const { data, error } = await createClient()
    .from("products")
    .insert(productPayload(product))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProduct(data as ProductRow);
}

export async function patchProduct(
  id: string,
  patch: Partial<ProductInput>
): Promise<Product> {
  const { data, error } = await createClient()
    .from("products")
    .update(productPayload(patch))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProduct(data as ProductRow);
}

export async function removeProduct(id: string): Promise<void> {
  const { error } = await createClient().from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createBrand(brand: Brand): Promise<Brand> {
  const { data, error } = await createClient()
    .from("brands")
    .insert(brand)
    .select("id, name")
    .single();

  if (error) throw new Error(error.message);
  return data as Brand;
}

export async function renameBrand(id: string, name: string): Promise<void> {
  const { error } = await createClient()
    .from("brands")
    .update({ name })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeBrand(id: string): Promise<void> {
  const { error } = await createClient().from("brands").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createCategory(category: Category): Promise<Category> {
  const { data, error } = await createClient()
    .from("categories")
    .insert(category)
    .select("id, name")
    .single();

  if (error) throw new Error(error.message);
  return data as Category;
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const { error } = await createClient()
    .from("categories")
    .update({ name })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeCategory(id: string): Promise<void> {
  const { error } = await createClient()
    .from("categories")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
