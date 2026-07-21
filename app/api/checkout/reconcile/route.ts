import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyOrderInventory } from "@/lib/inventory";
import { retrieveCheckoutSession } from "@/lib/paymongo";

/**
 * Admin: re-check pending PayMongo checkouts and mark paid ones.
 * Also applies inventory for any paid orders that never decremented stock.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }

    const writer = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createServiceClient()
      : supabase;

    const { data: pending, error } = await writer
      .from("orders")
      .select("id, paymongo_checkout_id")
      .eq("payment_status", "Pending")
      .not("paymongo_checkout_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let markedPaid = 0;
    const failures: string[] = [];

    for (const row of pending ?? []) {
      if (!row.paymongo_checkout_id) continue;
      try {
        const session = await retrieveCheckoutSession(row.paymongo_checkout_id);
        if (!session.paid) continue;

        const { error: updateError } = await writer
          .from("orders")
          .update({
            payment_status: "Paid",
            paymongo_payment_id: session.paymentId ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);

        if (updateError) {
          failures.push(`${row.id}: ${updateError.message}`);
        } else {
          markedPaid += 1;
          await applyOrderInventory(writer, row.id);
        }
      } catch (err) {
        failures.push(
          `${row.id}: ${err instanceof Error ? err.message : "verify failed"}`
        );
      }
    }

    // Backfill stock for paid orders that never had inventory applied.
    const { data: needStock } = await writer
      .from("orders")
      .select("id")
      .eq("payment_status", "Paid")
      .eq("inventory_applied", false)
      .order("created_at", { ascending: true })
      .limit(50);

    let inventoryApplied = 0;
    for (const row of needStock ?? []) {
      const result = await applyOrderInventory(writer, row.id);
      if (result.ok) inventoryApplied += 1;
      else if (result.error) failures.push(`${row.id}: ${result.error}`);
    }

    return NextResponse.json({
      checked: pending?.length ?? 0,
      markedPaid,
      inventoryApplied,
      failures,
    });
  } catch (err) {
    console.error("[checkout/reconcile]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Reconcile failed.",
      },
      { status: 500 }
    );
  }
}
