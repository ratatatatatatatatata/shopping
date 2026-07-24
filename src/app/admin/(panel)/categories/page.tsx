import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export type CategoryWithCount = Category & {
  products: { count: number }[];
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order")
    .order("created_at");

  const categories = (data ?? []) as unknown as CategoryWithCount[];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">
        Ангилал ({categories.length})
      </h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
