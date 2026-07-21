import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckoutSession,
  toCentavos,
} from "@/lib/paymongo";
import type { CartItem, CheckoutDetails } from "@/lib/types";

type Body = {
  orderId: string;
  items: CartItem[];
  total: number;
  customer: CheckoutDetails;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in or create an account to place an order." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      return NextResponse.json(
        {
          error:
            "Admin accounts cannot place store orders. Sign in with a customer account.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Body;
    const { orderId, items, total, customer } = body;

    if (!orderId || !items?.length || !customer || !(total > 0)) {
      return NextResponse.json(
        { error: "Invalid checkout payload." },
        { status: 400 }
      );
    }

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      user_id: user.id,
      total,
      status: "Pending",
      payment_status: "Pending",
      payment_method: "paymongo",
      shipping_carrier: customer.shippingCarrier,
      first_name: customer.firstName,
      last_name: customer.lastName,
      contact_number: customer.contactNumber,
      email: customer.email,
      country: customer.country,
      region: customer.region,
      postal_code: customer.postalCode,
      barangay: customer.barangay,
      city: customer.city,
      pinned_location: customer.pinnedLocation ?? null,
      notes: customer.notes ?? null,
    });

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        name: item.name,
        unit_price: item.unitPrice,
        image: item.image,
        size: item.size ?? null,
        quantity: item.quantity,
      }))
    );

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", orderId);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const lineItems = items.map((item) => ({
      name: item.size ? `${item.name} (${item.size})` : item.name,
      amount: toCentavos(item.unitPrice),
      currency: "PHP" as const,
      quantity: item.quantity,
    }));

    const session = await createCheckoutSession({
      lineItems,
      description: `Good Catch order ${orderId}`,
      referenceNumber: orderId,
      successUrl: `${origin}/order-confirmation?order=${encodeURIComponent(orderId)}`,
      cancelUrl: `${origin}/checkout?cancelled=1&order=${encodeURIComponent(orderId)}`,
      customerEmail: customer.email,
      metadata: { order_id: orderId, user_id: user.id },
    });

    await supabase
      .from("orders")
      .update({ paymongo_checkout_id: session.id })
      .eq("id", orderId);

    return NextResponse.json({
      checkoutUrl: session.checkoutUrl,
      checkoutId: session.id,
      orderId,
    });
  } catch (err) {
    console.error("[checkout/create]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to start payment.",
      },
      { status: 500 }
    );
  }
}
