# Good Catch — Thrifted Apparel Store

A modern, animated e-commerce web app for **Good Catch**, a thrift apparel store with an in-store pickup model: customers browse and order online, pay via GCash (placeholder for now), and pick up in store. No shipping.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand**.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin access

Go to `/admin/login` and use the placeholder credentials:

- Email: `admin@goodcatch.shop`
- Password: `goodcatch123`

## Pages

| Route | Description |
| --- | --- |
| `/` | Homepage — hero with animated visual, New Arrivals, On Sale, categories, brands |
| `/shop` | Full listing with search, category/brand/price filters, and sorting |
| `/product/[id]` | Product detail with gallery, sizes, and add to cart |
| `/cart` | Cart page (a slide-in cart drawer is also available everywhere) |
| `/checkout` | Guest checkout — details, pin-location placeholder, GCash placeholder |
| `/order-confirmation` | Post-checkout confirmation |
| `/admin/login` | Admin login (placeholder auth) |
| `/admin` | Protected dashboard with stats |
| `/admin/products` (+ `new`, `[id]/edit`) | Product CRUD incl. discounts, flags, placeholder images |
| `/admin/brands`, `/admin/categories` | Manage brands/categories (feed the shop filters) |
| `/admin/orders` | Orders list with Pending / Ready for Pickup / Completed statuses |

## Architecture notes (for future backend integration)

- **`lib/api.ts`** — the data-access layer. All seed data flows through these async functions; swap their bodies for Firestore/REST calls and the UI keeps working.
- **`lib/store/`** — Zustand stores (catalog, cart, orders, auth), persisted to `localStorage` so the whole app is clickable without a backend.
- **`lib/seed-data.ts`** — placeholder products/brands/categories and the extensible `curatedSections` array (add "Best Sellers", "Staff Picks", etc. here).
- **Placeholder swap points:**
  - `components/Logo.tsx` — replace the text wordmark with a real logo image.
  - `components/ProductImage.tsx` — supports real image URLs already; `placeholder:<hue>` refs render styled boxes.
  - `components/home/HeroVisual.tsx` — slot for a Spline embed or React Three Fiber canvas.
  - `components/MapPickerPlaceholder.tsx` — slot for Leaflet / Google Maps.
  - `lib/store/auth-store.ts` — slot for NextAuth / Firebase Auth.
  - GCash section in `app/(store)/checkout/page.tsx` — slot for the real payment API.
