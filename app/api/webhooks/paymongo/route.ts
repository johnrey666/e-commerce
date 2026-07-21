import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { applyOrderInventory } from "@/lib/inventory";

/**
 * PayMongo webhook — subscribe to checkout_session.payment.paid
 * Dashboard → Developers → Webhooks → URL: /api/webhooks/paymongo
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      data?: {
        attributes?: {
          type?: string;
          data?: {
            id?: string;
            attributes?: {
              reference_number?: string;
              metadata?: { order_id?: string };
              payments?: Array<{ id?: string }>;
            };
          };
        };
      };
    };

    const eventType = payload.data?.attributes?.type;
    const checkout = payload.data?.attributes?.data;
    const orderId =
      checkout?.attributes?.metadata?.order_id ||
      checkout?.attributes?.reference_number;

    if (eventType !== "checkout_session.payment.paid" || !orderId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const paymentId = checkout?.attributes?.payments?.[0]?.id;
    const supabase = createServiceClient();

    await supabase
      .from("orders")
      .update({
        payment_status: "Paid",
        paymongo_checkout_id: checkout?.id ?? null,
        paymongo_payment_id: paymentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    await applyOrderInventory(supabase, orderId);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhooks/paymongo]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 }
    );
  }
}
