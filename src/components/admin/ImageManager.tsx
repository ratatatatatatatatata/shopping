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
  /** CSS object-position: which part of the photo stays visible when cropped. */
  object_position: string;
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
        object_position: "center",
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

  /** Move an image to an exact position (1-based select). */
  function moveTo(index: number, target: number) {
    if (target < 0 || target >= images.length || target === index) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
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
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl || img.url}
                alt=""
                className="h-16 w-14 rounded-xl bg-smoke object-cover"
                style={{ objectPosition: img.object_position }}
              />
              <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                {i + 1}
              </span>
            </div>
            <div className="min-w-[140px] flex-1">
              <input
                className="input !py-1.5 text-xs"
                value={img.alt}
                onChange={(e) => update(i, { alt: e.target.value })}
                placeholder="Alt тайлбар"
              />
            </div>
            <select
              className="input !w-28 cursor-pointer !py-1.5 text-xs"
              value={i}
              onChange={(e) => moveTo(i, Number(e.target.value))}
              title="Байрлал сонгох"
            >
              {images.map((_, pos) => (
                <option key={pos} value={pos}>
                  Байрлал {pos + 1}
                </option>
              ))}
            </select>
            <select
              className="input !w-32 cursor-pointer !py-1.5 text-xs"
              value={img.object_position}
              onChange={(e) => update(i, { object_position: e.target.value })}
              title="Зургийн аль хэсэг харагдахыг сонгох"
            >
              <option value="top">Дээд хэсэг</option>
              <option value="center">Төв хэсэг</option>
              <option value="bottom">Доод хэсэг</option>
            </select>
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
