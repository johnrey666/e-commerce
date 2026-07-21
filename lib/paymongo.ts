/** PayMongo helpers — server-side only (secret key). */

const PAYMONGO_API_V1 = "https://api.paymongo.com/v1";
const PAYMONGO_API_V2 = "https://api.paymongo.com/v2";

export type PaymongoLineItem = {
  name: string;
  amount: number; // centavos
  currency: "PHP";
  quantity: number;
};

function authHeader(): string {
  const secret = process.env.PAYMONGO_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "PAYMONGO_SECRET_KEY is missing. Add your PayMongo secret test key (sk_test_…) to .env.local."
    );
  }
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

export async function createCheckoutSession(input: {
  lineItems: PaymongoLineItem[];
  description: string;
  referenceNumber: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<{
  id: string;
  checkoutUrl: string;
}> {
  const response = await fetch(`${PAYMONGO_API_V2}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: input.lineItems,
          payment_method_types: ["card", "gcash", "paymaya", "grab_pay", "qrph"],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          description: input.description,
          reference_number: input.referenceNumber,
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          metadata: input.metadata ?? {},
          ...(input.customerEmail
            ? { billing: { email: input.customerEmail } }
            : {}),
        },
      },
    }),
  });

  const json = (await response.json()) as {
    data?: {
      id: string;
      attributes: { checkout_url: string };
    };
    errors?: Array<{ detail?: string; code?: string }>;
  };

  if (!response.ok || !json.data) {
    const detail =
      json.errors?.map((e) => e.detail).filter(Boolean).join("; ") ||
      `PayMongo error (${response.status})`;
    throw new Error(detail);
  }

  return {
    id: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
  };
}

type RawPayment = {
  id?: string;
  status?: string;
  attributes?: { status?: string };
};

type CheckoutSessionJson = {
  data?: {
    id: string;
    attributes: {
      status?: string;
      payments?: RawPayment[] | string[];
      payment_intent?: {
        id?: string;
        attributes?: { status?: string };
      } | null;
      metadata?: { order_id?: string };
      reference_number?: string;
    };
  };
  errors?: Array<{ detail?: string }>;
};

const PAID_STATUSES = new Set([
  "paid",
  "succeeded",
  "success",
  "successful",
]);

function normalizeStatus(value?: string | null): string {
  return (value ?? "").toLowerCase().trim();
}

function isPaidStatus(value?: string | null): boolean {
  return PAID_STATUSES.has(normalizeStatus(value));
}

async function fetchSession(
  base: string,
  checkoutId: string
): Promise<CheckoutSessionJson | null> {
  const response = await fetch(`${base}/checkout_sessions/${checkoutId}`, {
    method: "GET",
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
    },
  });
  const json = (await response.json()) as CheckoutSessionJson;
  if (!response.ok || !json.data) return null;
  return json;
}

async function fetchPaymentStatus(paymentId: string): Promise<string | null> {
  const response = await fetch(`${PAYMONGO_API_V1}/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
    },
  });
  const json = (await response.json()) as {
    data?: { id: string; attributes?: { status?: string } };
  };
  if (!response.ok || !json.data) return null;
  return json.data.attributes?.status ?? null;
}

export async function retrieveCheckoutSession(checkoutId: string): Promise<{
  id: string;
  payments: Array<{ id: string; status: string }>;
  status: string;
  paid: boolean;
  paymentId?: string;
}> {
  const json =
    (await fetchSession(PAYMONGO_API_V2, checkoutId)) ??
    (await fetchSession(PAYMONGO_API_V1, checkoutId));

  if (!json?.data) {
    throw new Error(`PayMongo retrieve failed for ${checkoutId}`);
  }

  const attrs = json.data.attributes;
  const rawPayments = attrs.payments ?? [];
  const payments: Array<{ id: string; status: string }> = [];

  for (const entry of rawPayments) {
    if (typeof entry === "string") {
      const status = (await fetchPaymentStatus(entry)) ?? "unknown";
      payments.push({ id: entry, status });
      continue;
    }
    const id = entry.id ?? "";
    const status =
      entry.attributes?.status ?? entry.status ?? "unknown";
    payments.push({ id, status });
  }

  const paidFromPayments = payments.find((p) => isPaidStatus(p.status));
  const paidFromIntent = isPaidStatus(attrs.payment_intent?.attributes?.status);
  const paidFromSession = isPaidStatus(attrs.status);
  const paid = Boolean(paidFromPayments) || paidFromIntent || paidFromSession;

  return {
    id: json.data.id,
    status: attrs.status ?? "unknown",
    payments,
    paid,
    paymentId:
      paidFromPayments?.id ||
      attrs.payment_intent?.id ||
      payments[0]?.id,
  };
}

/** Convert PHP pesos to centavos for PayMongo. */
export function toCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}
