"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductGrid } from "@/components/store/ProductGrid";
import { EmptyState } from "@/components/store/EmptyState";

export default function WishlistPage() {
  const productIds = useWishlist((s) => s.productIds);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const idsKey = productIds.join(",");

  useEffect(() => {
    if (!productIds.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("products")
      .select("*, categories(*), product_colors(*), product_variants(*)")
      .in("id", productIds)
      .eq("status", "published")
      .then(({ data }) => {
        setProducts((data ?? []) as unknown as Product[]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Instant removal when a heart is toggled off
  const visible = products.filter((p) => productIds.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        Хадгалсан <span className="text-gradient">бараа</span>
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Таалагдсан загваруудаа энд хадгалаарай.
      </p>
      <div className="mt-8">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title="Хадгалсан бараа алга"
            description="Зүрхэн товчийг дарж дуртай бараагаа хадгалаарай."
            actionLabel="Дэлгүүр үзэх"
            actionHref="/shop"
          />
        ) : (
          <ProductGrid products={visible} />
        )}
      </div>
    </div>
  );
}
