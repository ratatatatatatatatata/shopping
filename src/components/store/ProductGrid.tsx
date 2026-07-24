"use client";

import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { StaggerGrid } from "./AnimatedSection";
import { EmptyState } from "./EmptyState";

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <EmptyState
        title="Бараа олдсонгүй"
        description="Шүүлтүүрээ өөрчилж дахин хайна уу."
        actionLabel="Бүх бараа үзэх"
        actionHref="/shop"
      />
    );
  }
  return (
    <StaggerGrid className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </StaggerGrid>
  );
}
