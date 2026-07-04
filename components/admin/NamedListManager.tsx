"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CheckIcon, CloseIcon, TrashIcon } from "@/components/icons";

interface NamedItem {
  id: string;
  name: string;
}

/** Shared add/edit/remove list UI used for both Brands and Categories. */
export function NamedListManager({
  title,
  description,
  items,
  usageCount,
  onAdd,
  onUpdate,
  onDelete,
}: {
  title: string;
  description: string;
  items: NamedItem[];
  /** How many products reference an item — deletion is blocked while > 0. */
  usageCount: (id: string) => number;
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) return;
    onAdd(name);
    setNewName("");
  };

  const saveEdit = (id: string) => {
    const name = editName.trim();
    if (name) onUpdate(id, name);
    setEditingId(null);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted">{description}</p>

      <form onSubmit={handleAdd} className="mt-6 flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`New ${title.toLowerCase().replace(/s$/, "")} name…`}
          aria-label={`New ${title} name`}
          className="flex-1 rounded-full border border-line bg-white px-5 py-3 text-sm outline-none transition-colors focus:border-brand"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Add
        </motion.button>
      </form>

      <ul className="mt-6 divide-y divide-line rounded-3xl bg-white px-6 shadow-card">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const used = usageCount(item.id);
            const isEditing = editingId === item.id;
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 py-4"
              >
                {isEditing ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(item.id)}
                      aria-label={`Rename ${item.name}`}
                      autoFocus
                      className="flex-1 rounded-xl border border-brand px-4 py-2 text-sm outline-none"
                    />
                    <button
                      onClick={() => saveEdit(item.id)}
                      aria-label="Save name"
                      className="grid size-9 place-items-center rounded-full bg-brand text-white hover:bg-brand-dark"
                    >
                      <CheckIcon width={16} height={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel rename"
                      className="grid size-9 place-items-center rounded-full border border-line hover:border-ink"
                    >
                      <CloseIcon width={16} height={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted">
                        {used} {used === 1 ? "product" : "products"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
                      }}
                      className="rounded-full border border-line px-4 py-1.5 text-xs font-medium transition-colors hover:border-brand hover:text-brand"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        if (used > 0) {
                          window.alert(
                            `Cannot delete "${item.name}" — ${used} product(s) still use it.`
                          );
                          return;
                        }
                        if (window.confirm(`Delete "${item.name}"?`)) {
                          onDelete(item.id);
                        }
                      }}
                      aria-label={`Delete ${item.name}`}
                      className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-brand-light hover:text-brand"
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
        {items.length === 0 && (
          <li className="py-10 text-center text-sm text-muted">
            Nothing here yet — add one above.
          </li>
        )}
      </ul>
    </div>
  );
}
