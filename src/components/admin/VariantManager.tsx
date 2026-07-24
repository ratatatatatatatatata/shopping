"use client";

import { Plus, Trash2, Upload } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface SizeDraft {
  id?: string;
  size: string;
  stock_quantity: number;
  sku: string;
  price: string; // keep as string for input editing
  sale_price: string;
  status: "active" | "inactive";
}

export interface ColorDraft {
  id?: string;
  /** Stable local key used by ImageManager to link images to colors. */
  _key: string;
  color_name: string;
  color_code: string;
  image_url: string;
  file?: File;
  previewUrl?: string;
  sizes: SizeDraft[];
}

export function newColorKey(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptySize(): SizeDraft {
  return {
    size: "",
    stock_quantity: 0,
    sku: "",
    price: "",
    sale_price: "",
    status: "active",
  };
}

export function VariantManager({
  colors,
  onChange,
}: {
  colors: ColorDraft[];
  onChange: (colors: ColorDraft[]) => void;
}) {
  function updateColor(index: number, patch: Partial<ColorDraft>) {
    onChange(colors.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function updateSize(ci: number, si: number, patch: Partial<SizeDraft>) {
    onChange(
      colors.map((c, i) =>
        i === ci
          ? {
              ...c,
              sizes: c.sizes.map((s, j) => (j === si ? { ...s, ...patch } : s)),
            }
          : c
      )
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {colors.map((color, ci) => (
          <motion.div
            key={color._key}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="rounded-2xl border border-ink/10 p-4"
          >
            <div className="flex items-start gap-4">
              {/* Color image */}
              <label className="group relative flex h-28 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-ink/15 bg-smoke">
                {color.previewUrl || color.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={color.previewUrl || color.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Upload className="h-5 w-5 text-neutral-400" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Зураг солих
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      updateColor(ci, {
                        file,
                        previewUrl: URL.createObjectURL(file),
                      });
                  }}
                />
              </label>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[140px] flex-1">
                    <label className="label">Өнгөний нэр</label>
                    <input
                      className="input !py-2"
                      value={color.color_name}
                      onChange={(e) =>
                        updateColor(ci, { color_name: e.target.value })
                      }
                      placeholder="Хар"
                    />
                  </div>
                  <div>
                    <label className="label">Код</label>
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded-xl border border-ink/10"
                      value={color.color_code}
                      onChange={(e) =>
                        updateColor(ci, { color_code: e.target.value })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(colors.filter((_, i) => i !== ci))}
                    className="rounded-full p-2.5 text-red-500 hover:bg-red-50"
                    aria-label="Өнгө устгах"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Sizes */}
                <div className="space-y-2">
                  <div className="hidden flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 sm:flex">
                    <span className="w-20 text-center">Размер</span>
                    <span className="w-24">Үлдэгдэл</span>
                    <span className="w-28">SKU</span>
                    <span className="w-28">Үнэ</span>
                    <span className="w-28">Хямдрал</span>
                    <span>Идэвхтэй</span>
                  </div>
                  {color.sizes.map((s, si) => (
                    <div key={si} className="flex flex-wrap items-center gap-2">
                      <input
                        className="input !w-20 !py-1.5 text-center"
                        value={s.size}
                        onChange={(e) =>
                          updateSize(ci, si, { size: e.target.value })
                        }
                        placeholder="M"
                      />
                      <input
                        type="number"
                        min={0}
                        className="input !w-24 !py-1.5"
                        value={s.stock_quantity}
                        onChange={(e) =>
                          updateSize(ci, si, {
                            stock_quantity: Number(e.target.value),
                          })
                        }
                        placeholder="Үлдэгдэл"
                      />
                      <input
                        className="input !w-28 !py-1.5"
                        value={s.sku}
                        onChange={(e) =>
                          updateSize(ci, si, { sku: e.target.value })
                        }
                        placeholder="SKU"
                      />
                      <input
                        type="number"
                        min={0}
                        className="input !w-28 !py-1.5"
                        value={s.price}
                        onChange={(e) =>
                          updateSize(ci, si, { price: e.target.value })
                        }
                        placeholder="Үнэ (₮)"
                      />
                      <input
                        type="number"
                        min={0}
                        className="input !w-28 !py-1.5"
                        value={s.sale_price}
                        onChange={(e) =>
                          updateSize(ci, si, { sale_price: e.target.value })
                        }
                        placeholder="Хямдрал (₮)"
                      />
                      <label
                        className="flex cursor-pointer items-center gap-1.5"
                        title="Идэвхтэй эсэх"
                      >
                        <input
                          type="checkbox"
                          checked={s.status === "active"}
                          onChange={(e) =>
                            updateSize(ci, si, {
                              status: e.target.checked ? "active" : "inactive",
                            })
                          }
                          className="h-4 w-4 accent-ink"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateColor(ci, {
                            sizes: color.sizes.filter((_, j) => j !== si),
                          })
                        }
                        className="rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateColor(ci, {
                        sizes: [...color.sizes, emptySize()],
                      })
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-electric hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Размер нэмэх
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={() =>
          onChange([
            ...colors,
            {
              _key: newColorKey(),
              color_name: "",
              color_code: "#111111",
              image_url: "",
              sizes: [emptySize()],
            },
          ])
        }
        className="btn-outline w-full !py-2.5 text-xs"
      >
        <Plus className="h-4 w-4" /> Өнгө нэмэх
      </button>
    </div>
  );
}
