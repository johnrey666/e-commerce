import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyOrderInventory } from "@/lib/inventory";
import { retrieveCheckoutSession } from "@/lib/paymongo";

async function getWriteClient() {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return createServiceClient();
    }
  } catch {
    // fall through
  }
  return createClient();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = (await request.json()) as { orderId?: string };
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, user_id, payment_status, paymongo_checkout_id")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const writer = await getWriteClient();

    if (order.payment_status === "Paid") {
      await applyOrderInventory(writer, orderId);
      return NextResponse.json({ paymentStatus: "Paid" });
    }

    if (!order.paymongo_checkout_id) {
      return NextResponse.json(
        { paymentStatus: "Pending", error: "No PayMongo session yet." },
        { status: 400 }
      );
    }

    const session = await retrieveCheckoutSession(order.paymongo_checkout_id);

    if (!session.paid) {
      return NextResponse.json({
        paymentStatus: "Pending",
        sessionStatus: session.status,
        payments: session.payments,
      });
    }

    const { error: updateError } = await writer
      .from("orders")
      .update({
        payment_status: "Paid",
        paymongo_payment_id: session.paymentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("[checkout/verify] update failed:", updateError.message);
      return NextResponse.json(
        { error: updateError.message, paymentStatus: "Pending" },
        { status: 500 }
      );
    }

    await applyOrderInventory(writer, orderId);

    return NextResponse.json({ paymentStatus: "Paid" });
  } catch (err) {
    console.error("[checkout/verify]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}
