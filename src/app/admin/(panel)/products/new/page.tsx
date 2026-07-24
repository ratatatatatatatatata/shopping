import { createClient } from "@/lib/supabase/server";
import type { Brand, Category } from "@/types";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();
  const [categoriesRes, brandsRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("brands").select("*").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Шинэ бараа нэмэх</h1>
      <ProductForm
        categories={(categoriesRes.data ?? []) as Category[]}
        brands={(brandsRes.data ?? []) as Brand[]}
      />
    </div>
  );
}
