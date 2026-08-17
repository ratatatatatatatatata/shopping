"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Category } from "@/types";
import { AnimatedSection, StaggerGrid, staggerItem } from "./AnimatedSection";

export function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6">
      <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">Ангилал</h2>
      <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => (
          <motion.div key={c.id} variants={staggerItem}>
            <Link href={`/shop?category=${c.slug}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-2xl bg-smoke">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image_url ?? ""}
                  alt={c.name}
                  className={`h-full w-full transition-transform duration-500 group-hover:scale-110 ${
                    c.image_fit === "contain"
                      ? "object-contain"
                      : "object-cover"
                  }`}
                  style={{ objectPosition: c.image_position ?? "center" }}
                />
              </div>
              <p className="mt-2.5 text-center text-sm font-semibold transition-colors group-hover:text-electric">
                {c.name}
              </p>
            </Link>
          </motion.div>
        ))}
      </StaggerGrid>
    </AnimatedSection>
  );
}
