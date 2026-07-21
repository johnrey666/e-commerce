import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Decrements product stock for a paid order (idempotent via DB function).
 */
export async function applyOrderInventory(
  client: SupabaseClient,
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await client.rpc("apply_order_inventory", {
    p_order_id: orderId,
  });

  if (error) {
    console.error("[inventory]", orderId, error.message);
    return { ok: false, error: error.message };
  }

  return { ok: Boolean(data) };
}
