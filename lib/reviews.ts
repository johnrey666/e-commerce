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

export async function fetchReviewsForProduct(
  productId: string
): Promise<ProductReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

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
    .select("*")
    .in("order_id", orderIds);

  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(mapReview);
}

/** Highest ratings first (5★ → 1★), then newest. */
export async function fetchReviewsConsolidated(limit?: number): Promise<ProductReview[]> {
  const supabase = createClient();
  let query = supabase
    .from("product_reviews")
    .select("*")
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit != null) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(mapReview);
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
