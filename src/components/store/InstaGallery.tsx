"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import type { Product } from "@/types";
import { AnimatedSection, StaggerGrid, staggerItem } from "./AnimatedSection";

export function InstaGallery({ products }: { products: Product[] }) {
  const items = products.slice(0, 6);
  if (!items.length) return null;

  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          @khet.mn
        </h2>
        <a
          href="#"
          className="flex items-center gap-2 text-sm font-semibold hover:text-grape"
        >
          <Instagram className="h-4 w-4" /> Дагах
        </a>
      </div>
      <StaggerGrid className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
        {items.map((p) => (
          <motion.div key={p.id} variants={staggerItem}>
            <Link
              href={`/product/${p.slug}`}
              className="group relative block aspect-square overflow-hidden rounded-xl bg-smoke"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.main_image_url ?? ""}
                alt={p.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Instagram className="h-6 w-6 text-white" />
              </div>
            </Link>
          </motion.div>
        ))}
      </StaggerGrid>
    </AnimatedSection>
  );
}
