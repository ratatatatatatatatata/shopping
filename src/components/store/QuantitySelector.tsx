"use client";

import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  quantity,
  max,
  onChange,
}: {
  quantity: number;
  max: number;
  onChange: (q: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-ink/10 px-3 py-2">
      <button
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className="rounded-full p-1.5 transition-colors hover:bg-smoke"
        aria-label="Хасах"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center font-semibold">{quantity}</span>
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        className="rounded-full p-1.5 transition-colors hover:bg-smoke"
        aria-label="Нэмэх"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
