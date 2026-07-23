import type { Category } from "@/lib/types";

export const OTHERS_CATEGORY_NAME = "Others";

/** Canonical catch-all subcategory ids seeded under each department. */
export const OTHERS_CATEGORY_IDS = ["men-others", "women-others"] as const;

export function isOthersCategory(
  category: Pick<Category, "id" | "name">
): boolean {
  if (
    (OTHERS_CATEGORY_IDS as readonly string[]).includes(category.id)
  ) {
    return true;
  }
  return category.name.trim().toLowerCase() === OTHERS_CATEGORY_NAME.toLowerCase();
}

export function othersCategoryIdForParent(parentId: string): string {
  return `${parentId}-others`;
}

/** Keep the catch-all "Others" row last within a department. */
export function sortCategoriesWithOthersLast(
  categories: Category[]
): Category[] {
  return [...categories].sort((a, b) => {
    const aOthers = isOthersCategory(a);
    const bOthers = isOthersCategory(b);
    if (aOthers !== bOthers) return aOthers ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}
