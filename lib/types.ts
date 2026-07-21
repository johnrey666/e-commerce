/** Core domain types for Good Catch. */

export interface Brand {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  /** Root departments (Men/Women) have no parent; subcategories point to one. */
  parentId: string | null;
}

export interface StoreInfoDetail {
  label: string;
  value: string;
  detail: string;
  href?: string;
}

export interface StoreInfoContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  tagline: string;
  exteriorUrl: string;
  interiorUrls: string[];
  details: StoreInfoDetail[];
}

export interface LandingContent {
  heroVideoUrl: string;
  /** Partner brand logo URLs — variable length; empty uses bundled defaults. */
  brandImages: string[];
  /** Headline above the brand logos strip. */
  brandsTitle: string;
  /** Optional storefront image keyed by subcategory ID. */
  categoryImages: Record<string, string>;
  storeInfo: StoreInfoContent;
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
  /** A product may appear in categories under more than one department. */
  categoryIds: string[];
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
export type PaymentStatus = "Pending" | "Paid";
export type ShippingCarrier = "JNT" | "DHL" | "LBC";
export type UserRole = "admin" | "user";

export interface CheckoutDetails {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  country: string;
  region: string;
  postalCode: string;
  barangay: string;
  city: string;
  /** Lat/lng string from the map pin, e.g. "14.5995, 120.9842". */
  pinnedLocation?: string;
  notes?: string;
  paymentMethod: "paymongo";
  shippingCarrier: ShippingCarrier;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  customer: CheckoutDetails;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymongoCheckoutId?: string;
  createdAt: string;
}

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: UserRole;
  body: string;
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
