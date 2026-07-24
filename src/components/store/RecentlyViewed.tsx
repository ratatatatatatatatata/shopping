"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { AnimatedSection, StaggerGrid } from "./AnimatedSection";

const RECENTLY_VIEWED_KEY = "orasuits-recently-viewed";

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let ids: string[] = [];
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      ids = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      ids = [];
    }
    ids = ids.filter((id) => id !== excludeId).slice(0, 8);
    if (!ids.length) {
      setProducts([]);
      return;
    }

    const supabase = createClient();
    supabase
      .from("products")
      .select("*, categories(*), product_colors(*), product_variants(*)")
      .in("id", ids)
      .eq("status", "published")
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as Product[];
        const byId = new Map(rows.map((p) => [p.id, p]));
        setProducts(
          ids
            .map((id) => byId.get(id))
            .filter((p): p is Product => Boolean(p))
        );
      });
  }, [excludeId]);

  if (!products.length) return null;

  return (
    <AnimatedSection>
      <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">
        Сүүлд үзсэн
      </h2>
      <StaggerGrid className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </StaggerGrid>
    </AnimatedSection>
  );
}
