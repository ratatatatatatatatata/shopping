import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Category, Product } from "@/types";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [productRes, categoriesRes, brandsRes] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_colors(*), product_variants(*), product_images(*)")
      .eq("id", id)
      .single(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("brands").select("*").order("name"),
  ]);

  if (!productRes.data) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Бараа засах</h1>
      <ProductForm
        categories={(categoriesRes.data ?? []) as Category[]}
        brands={(brandsRes.data ?? []) as Brand[]}
        product={productRes.data as Product}
      />
    </div>
  );
}
