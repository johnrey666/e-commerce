import type { Brand, Category, CuratedSection } from "./types";

/**
 * Starter brands/categories for the shop filters. Products are added through
 * the admin dashboard — the catalog starts empty.
 */

export const seedCategories: Category[] = [
  { id: "men", name: "Men" },
  { id: "women", name: "Women" },
  { id: "shirts", name: "Shirts" },
  { id: "shorts", name: "Shorts" },
  { id: "pants", name: "Pants" },
  { id: "hoodies", name: "Hoodies" },
  { id: "others", name: "Others" },
];

export const seedBrands: Brand[] = [
  { id: "nike", name: "Nike" },
  { id: "adidas", name: "Adidas" },
  { id: "uniqlo", name: "Uniqlo" },
  { id: "carhartt", name: "Carhartt" },
];

export const curatedSections: CuratedSection[] = [
  {
    id: "new-arrivals",
    title: "New Arrivals",
    subtitle: "Fresh finds, just racked",
    filter: "new-arrivals",
  },
  {
    id: "discounts",
    title: "On Sale",
    subtitle: "Good catches, better prices",
    filter: "on-sale",
  },
  // Add more sections here later, e.g. "Best Sellers", "Staff Picks".
];
