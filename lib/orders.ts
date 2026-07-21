import type {
  CartItem,
  CheckoutDetails,
  Order,
  OrderMessage,
  OrderStatus,
  PaymentStatus,
  ShippingCarrier,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  shipping_carrier: ShippingCarrier;
  first_name: string;
  last_name: string;
  contact_number: string;
  email: string;
  country: string;
  region: string;
  postal_code: string;
  barangay: string;
  city: string;
  pinned_location: string | null;
  notes: string | null;
  paymongo_checkout_id: string | null;
  created_at: string;
};

type OrderItemRow = {
  order_id: string;
  product_id: string;
  name: string;
  unit_price: number;
  image: string;
  size: string | null;
  quantity: number;
};

type MessageRow = {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

function rowToCustomer(row: OrderRow): CheckoutDetails {
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    contactNumber: row.contact_number,
    email: row.email,
    country: row.country,
    region: row.region,
    postalCode: row.postal_code,
    barangay: row.barangay,
    city: row.city,
    pinnedLocation: row.pinned_location ?? undefined,
    notes: row.notes ?? undefined,
    paymentMethod: "paymongo",
    shippingCarrier: row.shipping_carrier,
  };
}

function mapOrder(row: OrderRow, items: CartItem[]): Order {
  return {
    id: row.id,
    userId: row.user_id,
    items,
    total: Number(row.total),
    customer: rowToCustomer(row),
    status: row.status,
    paymentStatus: row.payment_status,
    paymongoCheckoutId: row.paymongo_checkout_id ?? undefined,
    createdAt: row.created_at,
  };
}

function mapMessage(row: MessageRow): OrderMessage {
  return {
    id: row.id,
    orderId: row.order_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function generateOrderId(): string {
  return `GC-${Date.now().toString(36).toUpperCase()}`;
}

export async function createOrderDraft(input: {
  orderId: string;
  userId: string;
  items: CartItem[];
  total: number;
  customer: CheckoutDetails;
}): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const supabase = createClient();
  const { customer, items, orderId, total, userId } = input;

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    user_id: userId,
    total,
    status: "Pending",
    payment_status: "Pending",
    payment_method: customer.paymentMethod,
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
    return { ok: false, error: orderError.message };
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
    return { ok: false, error: itemsError.message };
  }

  return {
    ok: true,
    order: {
      id: orderId,
      userId,
      items,
      total,
      customer,
      status: "Pending",
      paymentStatus: "Pending",
      createdAt: new Date().toISOString(),
    },
  };
}

export async function attachPaymongoCheckout(
  orderId: string,
  checkoutId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ paymongo_checkout_id: checkoutId })
    .eq("id", orderId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markOrderPaid(
  orderId: string,
  paymentId?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "Paid",
      paymongo_payment_id: paymentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function fetchItemsForOrders(
  orderIds: string[]
): Promise<Map<string, CartItem[]>> {
  const map = new Map<string, CartItem[]>();
  if (orderIds.length === 0) return map;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);

  if (error || !data) return map;

  for (const row of data as OrderItemRow[]) {
    const list = map.get(row.order_id) ?? [];
    list.push({
      productId: row.product_id,
      name: row.name,
      unitPrice: Number(row.unit_price),
      image: row.image,
      size: row.size ?? undefined,
      quantity: row.quantity,
    });
    map.set(row.order_id, list);
  }
  return map;
}

export async function fetchMyOrders(): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("[orders] fetchMyOrders:", error?.message);
    return [];
  }

  const rows = data as OrderRow[];
  const itemsMap = await fetchItemsForOrders(rows.map((r) => r.id));
  return rows.map((row) => mapOrder(row, itemsMap.get(row.id) ?? []));
}

/** Admin ledger — only successfully paid orders. */
export async function fetchAllOrders(): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_status", "Paid")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("[orders] fetchAllOrders:", error?.message);
    return [];
  }

  const rows = data as OrderRow[];
  const itemsMap = await fetchItemsForOrders(rows.map((r) => r.id));
  return rows.map((row) => mapOrder(row, itemsMap.get(row.id) ?? []));
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as OrderRow;
  const itemsMap = await fetchItemsForOrders([row.id]);
  return mapOrder(row, itemsMap.get(row.id) ?? []);
}

export async function fetchOrderMessages(
  orderId: string
): Promise<OrderMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("order_messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.warn("[orders] fetchOrderMessages:", error?.message);
    return [];
  }

  return (data as MessageRow[]).map(mapMessage);
}

export async function sendOrderMessage(input: {
  orderId: string;
  senderId: string;
  senderRole: "user" | "admin";
  body: string;
}): Promise<{ ok: true; message: OrderMessage } | { ok: false; error: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("order_messages")
    .insert({
      order_id: input.orderId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      body: input.body.trim(),
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to send message." };
  }

  return { ok: true, message: mapMessage(data as MessageRow) };
}
