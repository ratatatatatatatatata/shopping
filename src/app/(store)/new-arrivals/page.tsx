import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";
import { ProductGrid } from "@/components/store/ProductGrid";

export const metadata = { title: "Шинэ загварууд" };
export const revalidate = 60;

const PRODUCT_SELECT =
  "*, categories(*), product_colors(*), product_variants(*)";

export default async function NewArrivalsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(24);

  let products = (data ?? []) as unknown as Product[];

  // Fallback: nothing flagged -> newest published products
  if (!products.length) {
    const { data: newest } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(24);
    products = (newest ?? []) as unknown as Product[];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        Шинэ <span className="text-gradient">загварууд</span>
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Хамгийн сүүлд нэмэгдсэн загварууд.
      </p>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
