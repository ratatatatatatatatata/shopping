"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { AnimatedSection, StaggerGrid } from "./AnimatedSection";

export function ProductCarousel({
  title,
  products,
  href,
}: {
  title: string;
  products: Product[];
  href?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  if (!products.length) return null;

  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
        <div className="flex items-center gap-2">
          {href && (
            <Link
              href={href}
              className="mr-2 hidden items-center gap-1 text-sm font-semibold hover:text-electric sm:flex"
            >
              Бүгдийг үзэх <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <button
            onClick={() => scroll(-1)}
            className="rounded-full border border-ink/10 p-2.5 transition-all hover:border-ink"
            aria-label="Өмнөх"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="rounded-full border border-ink/10 p-2.5 transition-all hover:border-ink"
            aria-label="Дараах"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <StaggerGrid className="contents">
        <div
          ref={ref}
          className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => (
            <div key={p.id} className="w-56 shrink-0 snap-start sm:w-64">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </StaggerGrid>
    </AnimatedSection>
  );
}
