import { createClient } from "./supabase/client";
import type { Brand, Category, Product } from "./types";

/**
 * Supabase-backed catalog data access. Products, brands, and categories are
 * global; every browser reads and writes the same rows.
 */

interface ProductRow {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discount_price: number | null;
  on_sale: boolean;
  is_new_arrival: boolean;
  new_arrival_until: string | null;
  category_id: string;
  category_ids: string[];
  brand_id: string;
  condition: Product["condition"];
  images: string[];
  sizes: string[];
  stock: number;
  tags: string[];
  created_at: string;
}

type ProductInput = Omit<Product, "id" | "createdAt">;

function isNewArrivalActive(
  flagged: boolean,
  until: string | null | undefined
): boolean {
  if (!flagged) return false;
  if (!until) return true;
  return new Date(until).getTime() > Date.now();
}

function mapProduct(row: ProductRow): Product {
  const until = row.new_arrival_until ?? undefined;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    discountPrice:
      row.discount_price == null ? undefined : Number(row.discount_price),
    onSale: row.on_sale,
    isNewArrival: isNewArrivalActive(row.is_new_arrival, until ?? null),
    newArrivalUntil: until,
    categoryIds:
      row.category_ids?.length > 0 ? row.category_ids : [row.category_id],
    brandId: row.brand_id,
    condition: row.condition,
    images: row.images ?? [],
    sizes: row.sizes ?? [],
    stock: row.stock,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

/** Columns needed for grids/filters — omit long description payloads. */
const PRODUCT_LIST_SELECT =
  "id, name, price, discount_price, on_sale, is_new_arrival, new_arrival_until, category_id, category_ids, brand_id, condition, images, sizes, stock, tags, created_at";

const PRODUCT_FULL_SELECT = `${PRODUCT_LIST_SELECT}, description`;

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
    if (product.isNewArrival) {
      const until =
        product.newArrivalUntil ??
        new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      payload.new_arrival_until = until;
    } else {
      payload.new_arrival_until = null;
    }
  }
  if (product.newArrivalUntil !== undefined && product.isNewArrival === undefined) {
    payload.new_arrival_until = product.newArrivalUntil ?? null;
  }
  if (product.categoryIds !== undefined) {
    payload.category_ids = product.categoryIds;
    // Keep the original column populated for compatibility with existing SQL.
    payload.category_id = product.categoryIds[0];
  }
  if (product.brandId !== undefined) payload.brand_id = product.brandId;
  if (product.condition !== undefined) payload.condition = product.condition;
  if (product.images !== undefined) payload.images = product.images;
  if (product.sizes !== undefined) payload.sizes = product.sizes;
  if (product.stock !== undefined) payload.stock = product.stock;
  if (product.tags !== undefined) payload.tags = product.tags;

  return payload;
}

export async function fetchProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Expiry is derived in mapProduct via isNewArrivalActive — no write-on-read.
  return (data as ProductRow[]).map(mapProduct);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FULL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapProduct(data as ProductRow);
}

/** Related pieces in shared categories — capped for PDP. */
export async function fetchRelatedProducts(
  productId: string,
  categoryIds: string[],
  limit = 4
): Promise<Product[]> {
  if (categoryIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .neq("id", productId)
    .overlaps("category_ids", categoryIds)
    .order("created_at", { ascending: false })
    .limit(limit);

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

interface CategoryRow {
  id: string;
  name: string;
  parent_id: string | null;
}

function mapCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, parentId: row.parent_id };
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await createClient()
    .from("categories")
    .select("id, name, parent_id")
    .order("name");

  if (error) throw new Error(error.message);
  return (data as CategoryRow[]).map(mapCategory);
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
    .insert({
      id: category.id,
      name: category.name,
      parent_id: category.parentId,
    })
    .select("id, name, parent_id")
    .single();

  if (error) throw new Error(error.message);
  return mapCategory(data as CategoryRow);
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
