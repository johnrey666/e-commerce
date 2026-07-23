"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CheckIcon, CloseIcon, TrashIcon } from "@/components/icons";
import {
  isOthersCategory,
  OTHERS_CATEGORY_NAME,
  othersCategoryIdForParent,
  sortCategoriesWithOthersLast,
} from "@/lib/categories";
import { useCatalog } from "@/lib/hooks";
import { useCatalogStore } from "@/lib/store/catalog-store";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const { products, categories, ready } = useCatalog();
  const addCategory = useCatalogStore((s) => s.addCategory);
  const updateCategory = useCatalogStore((s) => s.updateCategory);
  const deleteCategory = useCatalogStore((s) => s.deleteCategory);

  const [newNames, setNewNames] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const parents = useMemo(
    () => categories.filter((c) => c.parentId === null),
    [categories]
  );

  const childrenOf = (parentId: string) => {
    const existing = sortCategoriesWithOthersLast(
      categories.filter((c) => c.parentId === parentId)
    );
    if (existing.some(isOthersCategory)) return existing;

    // Always surface the fixed catch-all even if the row is missing locally.
    const placeholder: Category = {
      id: othersCategoryIdForParent(parentId),
      name: OTHERS_CATEGORY_NAME,
      parentId,
    };
    return [...existing, placeholder];
  };

  const usageCount = (id: string) =>
    products.filter((p) => p.categoryIds.includes(id)).length;

  if (!ready) {
    return (
      <p className="py-12 text-center text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
        Loading
      </p>
    );
  }

  const handleAdd = async (parent: Category) => {
    const name = (newNames[parent.id] ?? "").trim();
    if (!name) return;
    if (name.toLowerCase() === OTHERS_CATEGORY_NAME.toLowerCase()) {
      setError('"Others" is fixed under each department and cannot be added.');
      return;
    }
    if (
      childrenOf(parent.id).some(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setError(`"${name}" already exists under ${parent.name}.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addCategory(name, parent.id);
      setNewNames((prev) => ({ ...prev, [parent.id]: "" }));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : `Could not add ${name}.`
      );
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      await updateCategory(id, name);
      setEditingId(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : `Could not rename ${name}.`
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (isOthersCategory(cat)) {
      setError('"Others" cannot be deleted.');
      return;
    }
    const used = usageCount(cat.id);
    if (used > 0) {
      window.alert(
        `Cannot delete "${cat.name}" — ${used} product(s) still use it.`
      );
      return;
    }
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(cat.id);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Could not delete ${cat.name}.`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Departments</p>
      <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
        Categories
      </h1>

      {error && (
        <p role="alert" className="mt-6 text-sm font-medium text-brand">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-10">
        {parents.map((parent) => {
          const children = childrenOf(parent.id);
          const directUse = usageCount(parent.id);
          return (
            <section key={parent.id}>
              <div className="flex items-baseline justify-between border-b border-ink pb-3">
                <h2 className="font-display text-xl font-medium text-ink">
                  {parent.name}
                </h2>
                <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">
                  Fixed department
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleAdd(parent);
                }}
                className="mt-5 flex gap-3"
              >
                <input
                  value={newNames[parent.id] ?? ""}
                  onChange={(e) =>
                    setNewNames((prev) => ({
                      ...prev,
                      [parent.id]: e.target.value,
                    }))
                  }
                  placeholder={`New ${parent.name.toLowerCase()}'s category…`}
                  aria-label={`New category under ${parent.name}`}
                  className="input-field flex-1"
                />
                <motion.button
                  type="submit"
                  disabled={busy}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary !px-8 !py-3.5 disabled:opacity-50"
                >
                  Add
                </motion.button>
              </form>

              <ul className="mt-5 divide-y divide-ink/8 border border-ink/10 bg-surface px-6 sm:px-7">
                <AnimatePresence initial={false}>
                  {children.map((cat) => {
                    const used = usageCount(cat.id);
                    const fixed = isOthersCategory(cat);
                    const isEditing = editingId === cat.id;
                    return (
                      <motion.li
                        key={cat.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 py-4"
                      >
                        {isEditing && !fixed ? (
                          <>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void saveEdit(cat.id);
                                }
                              }}
                              aria-label={`Rename ${cat.name}`}
                              autoFocus
                              className="min-w-0 flex-1 border border-ink px-4 py-2.5 text-sm text-ink outline-none"
                            />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void saveEdit(cat.id)}
                              aria-label="Save name"
                              className="grid size-9 shrink-0 place-items-center bg-brand text-white transition-colors hover:bg-brand-dark"
                            >
                              <CheckIcon width={16} height={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel rename"
                              className="grid size-9 shrink-0 place-items-center border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink"
                            >
                              <CloseIcon width={16} height={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-ink">
                                {cat.name}
                              </p>
                              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-ink/40">
                                {fixed
                                  ? "Fixed catch-all"
                                  : `${used} ${used === 1 ? "product" : "products"}`}
                              </p>
                            </div>
                            {fixed ? (
                              <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/35">
                                Locked
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(cat.id);
                                    setEditName(cat.name);
                                  }}
                                  className="shrink-0 border border-ink/15 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-ink/60 transition-all duration-300 hover:border-ink hover:text-ink"
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void handleDelete(cat)}
                                  aria-label={`Delete ${cat.name}`}
                                  className="grid size-8 shrink-0 place-items-center text-ink/35 transition-colors hover:bg-brand-soft hover:text-brand"
                                >
                                  <TrashIcon width={15} height={15} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>

              {directUse > 0 && (
                <p className="mt-3 text-[11px] leading-relaxed text-ink/40">
                  {directUse} product{directUse === 1 ? " is" : "s are"} filed
                  directly under {parent.name} — edit them to move them into a
                  category.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
