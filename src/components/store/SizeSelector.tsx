"use client";

import { useEffect, useMemo, useState } from "react";
import { Ruler, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { resolveSizeGuide } from "@/lib/sizeGuide";
import type { ProductVariant, SizeGuide } from "@/types";
import { cn } from "@/utils/format";

export function SizeSelector({
  variants,
  selected,
  sizeGuide,
  onSelect,
}: {
  variants: ProductVariant[];
  selected: ProductVariant | null;
  sizeGuide?: SizeGuide | null;
  onSelect: (variant: ProductVariant) => void;
}) {
  const [guideOpen, setGuideOpen] = useState(false);
  const guide = useMemo(
    () => resolveSizeGuide(sizeGuide, variants.map((variant) => variant.size)),
    [sizeGuide, variants]
  );

  useEffect(() => {
    if (!guideOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setGuideOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [guideOpen]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label !mb-0">Размер</span>
        {guide.rows.length > 0 && (
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-electric hover:underline"
          >
            <Ruler className="h-3.5 w-3.5" /> {guide.title}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const out = variant.stock_quantity <= 0;
          return (
            <button
              type="button"
              key={variant.id}
              disabled={out}
              onClick={() => onSelect(variant)}
              className={cn(
                "min-w-[52px] rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-medium transition-all hover:border-ink",
                selected?.id === variant.id && "border-ink bg-ink text-white",
                out &&
                  "cursor-not-allowed opacity-30 line-through hover:border-ink/10"
              )}
            >
              {variant.size}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="mt-2 text-xs text-neutral-500">
          Үлдэгдэл:{" "}
          <span
            className={cn(
              "font-semibold",
              selected.stock_quantity <= 5 ? "text-red-500" : "text-emerald-600"
            )}
          >
            {selected.stock_quantity} ширхэг
          </span>
        </p>
      )}

      <AnimatePresence>
        {guideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGuideOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="size-guide-title"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 id="size-guide-title" className="font-display font-bold">
                    {guide.title}
                  </h3>
                  {guide.description && (
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                      {guide.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="shrink-0 rounded-full p-2 hover:bg-smoke"
                  aria-label="Размерын заавар хаах"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 text-left text-xs uppercase text-neutral-400">
                      {guide.columns.map((column, index) => (
                        <th
                          key={`${column}-${index}`}
                          className="whitespace-nowrap px-3 py-2 first:pl-0"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {guide.rows.map((row, rowIndex) => (
                      <tr key={`${row[0] || "row"}-${rowIndex}`}>
                        {guide.columns.map((_, columnIndex) => (
                          <td
                            key={`cell-${columnIndex}`}
                            className={cn(
                              "whitespace-nowrap px-3 py-2.5 first:pl-0",
                              columnIndex === 0 && "font-semibold"
                            )}
                          >
                            {row[columnIndex] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
