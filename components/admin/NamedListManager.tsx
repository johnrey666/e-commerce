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
  eyebrow,
  description,
  items,
  usageCount,
  onAdd,
  onUpdate,
  onDelete,
}: {
  title: string;
  eyebrow?: string;
  description: string;
  items: NamedItem[];
  /** How many products reference an item — deletion is blocked while > 0. */
  usageCount: (id: string) => number;
  onAdd: (name: string) => void | Promise<void>;
  onUpdate: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(name);
      setNewName("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Could not add ${name}.`);
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
      await onUpdate(id, name);
      setEditingId(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : `Could not rename ${name}.`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
        {title}
      </h1>
      <p className="mt-3 text-[13px] leading-relaxed text-ink/45">
        {description}
      </p>

      <form onSubmit={handleAdd} className="mt-8 flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`New ${title.toLowerCase().replace(/s$/, "")} name…`}
          aria-label={`New ${title} name`}
          className="input-field flex-1"
        />
        <motion.button
          type="submit"
          disabled={busy}
          whileTap={{ scale: 0.97 }}
          className="btn-primary !px-8 !py-3.5 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Add"}
        </motion.button>
      </form>
      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-brand">
          {error}
        </p>
      )}

      <ul className="mt-8 divide-y divide-ink/8 border border-ink/10 bg-surface px-6 sm:px-7">
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveEdit(item.id);
                      }}
                      aria-label={`Rename ${item.name}`}
                      autoFocus
                      className="flex-1 border border-ink px-4 py-2.5 text-sm text-ink outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveEdit(item.id)}
                      aria-label="Save name"
                      className="grid size-9 place-items-center bg-brand text-white transition-colors hover:bg-brand-dark"
                    >
                      <CheckIcon width={16} height={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel rename"
                      className="grid size-9 place-items-center border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink"
                    >
                      <CloseIcon width={16} height={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-ink/40">
                        {used} {used === 1 ? "product" : "products"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
                      }}
                      className="border border-ink/15 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-ink/60 transition-all duration-300 hover:border-ink hover:text-ink"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (used > 0) {
                          window.alert(
                            `Cannot delete "${item.name}" — ${used} product(s) still use it.`
                          );
                          return;
                        }
                        if (window.confirm(`Delete "${item.name}"?`)) {
                          setBusy(true);
                          setError(null);
                          try {
                            await onDelete(item.id);
                          } catch (caught) {
                            setError(
                              caught instanceof Error
                                ? caught.message
                                : `Could not delete ${item.name}.`
                            );
                          } finally {
                            setBusy(false);
                          }
                        }
                      }}
                      aria-label={`Delete ${item.name}`}
                      className="grid size-8 place-items-center text-ink/35 transition-colors hover:bg-brand-soft hover:text-brand"
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
          <li className="py-12 text-center text-[13px] text-ink/45">
            Nothing here yet — add one above.
          </li>
        )}
      </ul>
    </div>
  );
}
