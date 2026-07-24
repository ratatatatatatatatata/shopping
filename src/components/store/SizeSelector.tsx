"use client";

import { useState } from "react";
import { Ruler, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductVariant } from "@/types";
import { cn } from "@/utils/format";

export function SizeSelector({
  variants,
  selected,
  onSelect,
}: {
  variants: ProductVariant[];
  selected: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
}) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label !mb-0">Размер</span>
        <button
          onClick={() => setGuideOpen(true)}
          className="flex items-center gap-1 text-xs font-medium text-electric hover:underline"
        >
          <Ruler className="h-3.5 w-3.5" /> Размерын заавар
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const out = v.stock_quantity <= 0;
          return (
            <button
              key={v.id}
              disabled={out}
              onClick={() => onSelect(v)}
              className={cn(
                "min-w-[52px] rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-medium transition-all hover:border-ink",
                selected?.id === v.id && "border-ink bg-ink text-white",
                out && "cursor-not-allowed opacity-30 line-through hover:border-ink/10"
              )}
            >
              {v.size}
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
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display font-bold">Размерын заавар</h3>
                <button
                  onClick={() => setGuideOpen(false)}
                  className="rounded-full p-2 hover:bg-smoke"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs uppercase text-neutral-400">
                    <th className="py-2">Размер</th>
                    <th>Цээж (см)</th>
                    <th>Урт (см)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  <tr><td className="py-2.5 font-semibold">S</td><td>96–100</td><td>66</td></tr>
                  <tr><td className="py-2.5 font-semibold">M</td><td>100–106</td><td>69</td></tr>
                  <tr><td className="py-2.5 font-semibold">L</td><td>106–112</td><td>72</td></tr>
                  <tr><td className="py-2.5 font-semibold">XL</td><td>112–118</td><td>75</td></tr>
                </tbody>
              </table>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
