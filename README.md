# Good Catch — Thrifted Apparel Store

Modern e-commerce for **Good Catch**: browse, check out with delivery details, pay via **PayMongo**, and track orders with seller chat.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand · Supabase · Leaflet · PayMongo**.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (for PayMongo webhooks) |
| `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` | PayMongo → Developers → API Keys |
| `PAYMONGO_SECRET_KEY` | PayMongo secret key (`sk_test_…`) — **required** to create checkout sessions |

### Database

1. In Supabase SQL Editor, run `supabase/schema.sql`.
2. Then run migrations in order under `supabase/migrations/` (`001` … `007`).
   Especially run `004` or `007` if you see `brands_title does not exist`.
   `005` reviews · `006` chat photos · `007` street + new-arrival expiry.

### Auth setup

1. **Email**: Authentication → Providers → Email. For local testing, turn off “Confirm email”.
2. **Google / Gmail**: Authentication → Providers → Google. Add your Google OAuth client. Add redirect URL:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   and site URL / additional redirect: `http://localhost:3000/auth/callback`
3. Create the first **admin** at `/admin/login` (Sign Up). Customer accounts use `/signup` or “Continue with Gmail” — they cannot access admin.

### PayMongo webhook (recommended)

Dashboard → Developers → Webhooks → add  
`https://your-domain/api/webhooks/paymongo`  
Subscribe to `checkout_session.payment.paid`.

On success redirect, the app also verifies payment via `/api/checkout/verify`.

## Pages

| Route | Description |
| --- | --- |
| `/` | Homepage |
| `/shop`, `/product/[id]` | Catalog |
| `/cart`, `/checkout` | Bag + delivery checkout (login required to place order) |
| `/login`, `/signup` | Customer accounts (email or Google) |
| `/account/orders` | Order history + chat with seller |
| `/order-confirmation` | After PayMongo payment |
| `/admin/login` | Admin only |
| `/admin/orders` | Pending / Paid payment + Out for Delivery |

## Checkout flow

1. Customer fills delivery details (name, contact, email, country default **Philippines**, region, postal, barangay, city, map pin, notes).
2. Selects PayMongo + shipping carrier (JNT / DHL / LBC).
3. Must be logged in as a **customer** (not admin).
4. Place Order → PayMongo hosted checkout → on success, order is **Paid** + fulfillment **Pending**.
5. Admin marks **Out for Delivery** when shipped.
