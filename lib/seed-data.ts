import type { Brand, Category, CuratedSection } from "./types";

/**
 * Starter brands/categories for the shop filters. Products are added through
 * the admin dashboard — the catalog starts empty.
 */

export const seedCategories: Category[] = [
  { id: "men", name: "Men", parentId: null },
  { id: "women", name: "Women", parentId: null },
  { id: "men-shirts", name: "Shirts", parentId: "men" },
  { id: "men-shorts", name: "Shorts", parentId: "men" },
  { id: "men-pants", name: "Pants", parentId: "men" },
  { id: "men-hoodies", name: "Hoodies", parentId: "men" },
  { id: "men-others", name: "Others", parentId: "men" },
  { id: "women-shirts", name: "Shirts", parentId: "women" },
  { id: "women-shorts", name: "Shorts", parentId: "women" },
  { id: "women-pants", name: "Pants", parentId: "women" },
  { id: "women-hoodies", name: "Hoodies", parentId: "women" },
  { id: "women-others", name: "Others", parentId: "women" },
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
