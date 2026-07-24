import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";
import { ProductGrid } from "@/components/store/ProductGrid";
import { EmptyState } from "@/components/store/EmptyState";

export const metadata = { title: "Хайлт" };
export const dynamic = "force-dynamic";

const PRODUCT_SELECT =
  "*, categories(*), product_colors(*), product_variants(*)";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  let products: Product[] = [];
  if (term) {
    const supabase = await createClient();
    // Sanitize for the PostgREST or() filter syntax
    const safe = term.replace(/[,()"'{}\\]/g, " ").replace(/\s+/g, " ").trim();
    if (safe) {
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "published")
        .or(`name.ilike.%${safe}%,tags.cs.{${safe}}`)
        .order("created_at", { ascending: false })
        .limit(48);
      products = (data ?? []) as unknown as Product[];
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        Хайлт{term ? <span className="text-neutral-400">: “{term}”</span> : ""}
      </h1>

      <form action="/search" method="GET" className="relative mt-6 max-w-2xl">
        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          name="q"
          defaultValue={term}
          placeholder="Барааны нэр, түлхүүр үгээр хайх..."
          autoFocus
          className="input !rounded-full !py-4 !pl-14 text-base"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800"
        >
          Хайх
        </button>
      </form>

      <div className="mt-10">
        {!term ? (
          <EmptyState
            title="Хайлт хийгээгүй байна"
            description="Дээрх талбарт хайх үгээ бичээд Хайх товчийг дарна уу."
            actionLabel="Бүх бараа үзэх"
            actionHref="/shop"
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="Илэрц олдсонгүй"
            description={`“${term}” гэсэн хайлтад тохирох бараа олдсонгүй. Өөр түлхүүр үгээр хайна уу.`}
            actionLabel="Бүх бараа үзэх"
            actionHref="/shop"
          />
        ) : (
          <>
            <p className="mb-4 text-xs text-neutral-400">
              Нийт {products.length} илэрц
            </p>
            <ProductGrid products={products} />
          </>
        )}
      </div>
    </div>
  );
}
