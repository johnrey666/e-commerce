/** Core domain types for Good Catch. */

export interface Brand {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export type ProductCondition =
  | "Brand New"
  | "Like New"
  | "Excellent"
  | "Good"
  | "Fair";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  /** When set (and lower than price), the product is on sale. */
  discountPrice?: number;
  /** Featured in the Discounts/Sale section. */
  onSale: boolean;
  isNewArrival: boolean;
  categoryId: string;
  brandId: string;
  condition: ProductCondition;
  /**
   * Image references. "placeholder:<hue>" renders a styled placeholder;
   * real image URLs/paths can be dropped in later.
   */
  images: string[];
  sizes: string[];
  stock: number;
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  image: string;
  size?: string;
  quantity: number;
}

export type OrderStatus = "Pending" | "Out for Delivery" | "Delivered";

export interface CheckoutDetails {
  firstName: string;
  lastName: string;
  address: string;
  /** Placeholder pinned map location, e.g. "14.5995, 120.9842". */
  pinnedLocation?: string;
  contactNumber: string;
  email: string;
  notes?: string;
  /** GCash reference number (placeholder — no real payment yet). */
  gcashReference?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customer: CheckoutDetails;
  status: OrderStatus;
  createdAt: string;
}

/** Curated homepage sections — extensible: add entries to seed data. */
export interface CuratedSection {
  id: string;
  title: string;
  subtitle?: string;
  /** Predicate key resolved in the data layer. */
  filter: "new-arrivals" | "on-sale" | "all";
}
