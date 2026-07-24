import { createClient } from "@/lib/supabase/server";
import { effectivePrice, type Product } from "@/types";
import { ProductGrid } from "@/components/store/ProductGrid";

export const metadata = { title: "Хямдрал" };
export const revalidate = 60;

export default async function SalePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(*), product_colors(*), product_variants(*)")
    .eq("status", "published");

  // Sale = product-level sale (window respected) or variant-level sale price
  const products = ((data ?? []) as unknown as Product[]).filter((p) => {
    const base = Number(p.base_price);
    if (effectivePrice(p) < base) return true;
    return (p.product_variants ?? []).some(
      (v) =>
        v.sale_price != null && Number(v.sale_price) < Number(v.price ?? base)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        <span className="text-gradient">Хямдрал</span>
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Хямдарсан үнэтэй загварууд — тоо хязгаартай.
      </p>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
