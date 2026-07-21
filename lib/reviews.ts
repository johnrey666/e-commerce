import type { ProductReview } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type ReviewRow = {
  id: string;
  order_id: string;
  product_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  product_name: string;
  reviewer_name: string;
  created_at: string;
};

function mapReview(row: ReviewRow): ProductReview {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    userId: row.user_id,
    rating: Number(row.rating),
    body: row.body?.trim() ? row.body : undefined,
    productName: row.product_name,
    reviewerName: row.reviewer_name || "Customer",
    createdAt: row.created_at,
  };
}

const REVIEW_LIST_SELECT =
  "id, order_id, product_id, user_id, rating, body, product_name, reviewer_name, created_at";

export async function fetchReviewsForProduct(
  productId: string,
  limit = 50
): Promise<ProductReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(REVIEW_LIST_SELECT)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(mapReview);
}

export async function fetchReviewsForOrders(
  orderIds: string[]
): Promise<ProductReview[]> {
  if (orderIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(REVIEW_LIST_SELECT)
    .in("order_id", orderIds);

  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(mapReview);
}

/** Highest ratings first (5★ → 1★), then newest. */
export async function fetchReviewsConsolidated(
  limit?: number
): Promise<ProductReview[]> {
  const supabase = createClient();
  let query = supabase
    .from("product_reviews")
    .select(REVIEW_LIST_SELECT)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit != null) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(mapReview);
}

/** Paginated shop-wide reviews (highest rated first). */
export async function fetchReviewsPage(
  page = 1,
  pageSize = 20
): Promise<{ reviews: ProductReview[]; total: number }> {
  const supabase = createClient();
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("product_reviews")
    .select(REVIEW_LIST_SELECT, { count: "exact" })
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    reviews: ((data ?? []) as ReviewRow[]).map(mapReview),
    total: count ?? 0,
  };
}

/** Shop-wide average via SQL aggregate (falls back to rating column). */
export async function fetchShopRatingSummary(): Promise<{
  average: number | null;
  count: number;
}> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("shop_rating_summary");

  if (!error && data != null) {
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      const count = Number(row.count ?? 0);
      const average =
        count === 0 || row.average == null
          ? null
          : Math.round(Number(row.average) * 10) / 10;
      return { average, count };
    }
  }

  // Fallback when RPC is not migrated yet.
  const { data: ratings, error: fallbackError, count } = await supabase
    .from("product_reviews")
    .select("rating", { count: "exact" });

  if (fallbackError) throw fallbackError;
  const rows = (ratings ?? []) as { rating: number }[];
  if (rows.length === 0) return { average: null, count: count ?? 0 };
  const sum = rows.reduce((acc, r) => acc + Number(r.rating), 0);
  return {
    average: Math.round((sum / rows.length) * 10) / 10,
    count: count ?? rows.length,
  };
}

/** Landing preview: prefer 5★, then lower — still highest-first. */
export async function fetchLandingReviews(
  count = 3
): Promise<ProductReview[]> {
  return fetchReviewsConsolidated(count);
}

export async function submitProductReview(input: {
  orderId: string;
  productId: string;
  rating: number;
  body?: string;
  productName: string;
  reviewerName: string;
}): Promise<ProductReview> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to leave a review.");

  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const body = input.body?.trim() || null;

  const { data, error } = await supabase
    .from("product_reviews")
    .upsert(
      {
        order_id: input.orderId,
        product_id: input.productId,
        user_id: user.id,
        rating,
        body,
        product_name: input.productName,
        reviewer_name: input.reviewerName || "Customer",
      },
      { onConflict: "order_id,product_id,user_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapReview(data as ReviewRow);
}

export function averageRating(reviews: ProductReview[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
