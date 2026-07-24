"use client";

import { AnimatePresence, motion } from "framer-motion";

export function ProductGallery({
  images,
  activeImage,
  onSelect,
  alt,
}: {
  images: string[];
  activeImage: string;
  onSelect: (url: string) => void;
  alt: string;
}) {
  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-smoke">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImage}
            src={activeImage}
            alt={alt}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img) => (
            <button
              key={img}
              onClick={() => onSelect(img)}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                activeImage === img
                  ? "border-ink"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
