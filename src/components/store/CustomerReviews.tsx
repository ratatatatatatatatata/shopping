"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Review } from "@/types";
import { AnimatedSection, StaggerGrid, staggerItem } from "./AnimatedSection";
import { cn } from "@/utils/format";

export type HomeReview = Review & {
  products?: { name: string; slug: string } | null;
};

export function CustomerReviews({ reviews }: { reviews: HomeReview[] }) {
  if (!reviews.length) return null;

  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6">
      <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">
        Хэрэглэгчдийн <span className="text-gradient">сэтгэгдэл</span>
      </h2>
      <StaggerGrid className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {reviews.slice(0, 3).map((r) => (
          <motion.div key={r.id} variants={staggerItem} className="card p-6">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "h-4 w-4",
                    n <= r.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-300"
                  )}
                />
              ))}
            </div>
            {r.comment && (
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-neutral-600">
                “{r.comment}”
              </p>
            )}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink/5 pt-4">
              <span className="text-sm font-semibold">
                {r.profiles?.full_name ?? "Хэрэглэгч"}
              </span>
              {r.products && (
                <Link
                  href={`/product/${r.products.slug}`}
                  className="max-w-[50%] truncate text-xs text-neutral-400 hover:text-electric"
                >
                  {r.products.name}
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </StaggerGrid>
    </AnimatedSection>
  );
}
