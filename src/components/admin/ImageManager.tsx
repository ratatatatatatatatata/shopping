"use client";

import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ColorDraft } from "./VariantManager";

export interface ImageDraft {
  /** DB id when the row already exists. */
  id?: string;
  /** Stable local key for React lists. */
  _key: string;
  url: string;
  file?: File;
  previewUrl?: string;
  alt: string;
  /** Local key of the color this image belongs to (ColorDraft._key), or null. */
  colorKey: string | null;
  is_cover: boolean;
}

export function newImageKey(): string {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageManager({
  images,
  onChange,
  colors,
}: {
  images: ImageDraft[];
  onChange: (images: ImageDraft[]) => void;
  colors: ColorDraft[];
}) {
  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = [...images];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        alert(`"${file.name}" зургийн файл биш байна.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`"${file.name}" 5MB-аас том байна.`);
        continue;
      }
      next.push({
        _key: newImageKey(),
        url: "",
        file,
        previewUrl: URL.createObjectURL(file),
        alt: "",
        colorKey: null,
        is_cover: next.length === 0 && images.length === 0,
      });
    }
    onChange(next);
  }

  function update(index: number, patch: Partial<ImageDraft>) {
    onChange(
      images.map((img, i) => (i === index ? { ...img, ...patch } : img))
    );
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function setCover(index: number) {
    onChange(images.map((img, i) => ({ ...img, is_cover: i === index })));
  }

  const namedColors = colors.filter((c) => c.color_name.trim());

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {images.map((img, i) => (
          <motion.div
            key={img._key}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.previewUrl || img.url}
              alt=""
              className="h-16 w-14 shrink-0 rounded-xl bg-smoke object-cover"
            />
            <div className="min-w-[140px] flex-1">
              <input
                className="input !py-1.5 text-xs"
                value={img.alt}
                onChange={(e) => update(i, { alt: e.target.value })}
                placeholder="Alt тайлбар"
              />
            </div>
            <select
              className="input !w-36 !py-1.5 text-xs"
              value={img.colorKey ?? ""}
              onChange={(e) =>
                update(i, { colorKey: e.target.value || null })
              }
            >
              <option value="">Бүх өнгө</option>
              {namedColors.map((c) => (
                <option key={c._key} value={c._key}>
                  {c.color_name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-smoke disabled:opacity-30"
                aria-label="Дээш"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-smoke disabled:opacity-30"
                aria-label="Доош"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCover(i)}
                title={img.is_cover ? "Нүүр зураг" : "Нүүр зураг болгох"}
                className={`rounded-full p-1.5 ${
                  img.is_cover
                    ? "text-amber-500"
                    : "text-neutral-400 hover:bg-smoke"
                }`}
              >
                <Star
                  className="h-4 w-4"
                  fill={img.is_cover ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="rounded-full p-1.5 text-red-500 hover:bg-red-50"
                aria-label="Устгах"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <label className="btn-outline w-full cursor-pointer !py-2.5 text-xs">
        <ImagePlus className="h-4 w-4" /> Зураг нэмэх (олноор)
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
