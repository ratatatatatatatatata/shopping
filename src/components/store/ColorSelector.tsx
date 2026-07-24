"use client";

import type { ProductColor } from "@/types";
import { cn } from "@/utils/format";

export function ColorSelector({
  colors,
  selected,
  onSelect,
}: {
  colors: ProductColor[];
  selected: ProductColor | null;
  onSelect: (color: ProductColor) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label !mb-0">Өнгө</span>
        <span className="text-xs text-neutral-500">{selected?.color_name}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => onSelect(color)}
            title={color.color_name}
            className={cn(
              "h-10 w-10 rounded-full border-2 border-ink/10 transition-all hover:scale-110",
              selected?.id === color.id && "ring-2 ring-ink ring-offset-2"
            )}
            style={{ backgroundColor: color.color_code }}
          />
        ))}
      </div>
    </div>
  );
}
