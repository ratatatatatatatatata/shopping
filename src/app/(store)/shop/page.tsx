import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { effectivePrice, type Product, type Category, type Brand } from "@/types";
import { PAGE_SIZE } from "@/lib/constants";
import { ProductGrid } from "@/components/store/ProductGrid";
import { SearchFilter } from "@/components/store/SearchFilter";
import { GridSkeleton } from "@/components/store/LoadingSkeleton";
import { cn } from "@/utils/format";
import {
  isAvailableSizeVariant,
  normalizeSizeKey,
  uniqueSortedAvailableSizes,
} from "@/utils/sizes";

export const metadata = { title: "Дэлгүүр" };
export const dynamic = "force-dynamic";

interface ShopParams {
  q?: string;
  category?: string;
  brand?: string;
  gender?: string;
  size?: string;
  color?: string;
  min?: string;
  max?: string;
  sort?: string;
  instock?: string;
  sale?: string;
  page?: string;
}

function productDiscountPct(p: Product): number {
  const base = Number(p.base_price);
  if (base <= 0) return 0;
  const eff = effectivePrice(p);
  const productPct = eff < base ? (base - eff) / base : 0;
  const variantPct = Math.max(
    0,
    ...(p.product_variants ?? []).map((v) => {
      const orig = Number(v.price ?? base);
      if (v.sale_price != null && Number(v.sale_price) < orig && orig > 0)
        return (orig - Number(v.sale_price)) / orig;
      return 0;
    })
  );
  return Math.max(productPct, variantPct);
}

function pageHref(params: ShopParams, page: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  sp.set("page", String(page));
  return `/shop?${sp.toString()}`;
}

async function ShopContent({ params }: { params: ShopParams }) {
  const supabase = await createClient();

  const joins = [
    params.category ? "categories!inner(*)" : "categories(*)",
    params.brand ? "brands!inner(*)" : "brands(*)",
  ].join(", ");

  let query = supabase
    .from("products")
    .select(`*, ${joins}, product_colors(*), product_variants(*)`)
    .eq("status", "published");

  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.category) query = query.eq("categories.slug", params.category);
  if (params.brand) query = query.eq("brands.slug", params.brand);
  if (params.gender) query = query.eq("gender", params.gender);
  if (params.min) query = query.gte("base_price", Number(params.min));
  if (params.max) query = query.lte("base_price", Number(params.max));

  switch (params.sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "popularity":
      query = query
        .order("is_best_seller", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query;
  let products = (data ?? []) as unknown as Product[];

  // Variant-level filters need JS checks
  if (params.size) {
    products = products.filter((p) =>
      p.product_variants?.some(
        (v) =>
          isAvailableSizeVariant(v) &&
          normalizeSizeKey(v.size) === normalizeSizeKey(params.size ?? "")
      )
    );
  }
  if (params.color) {
    products = products.filter((p) =>
      p.product_colors?.some((c) => c.color_name === params.color)
    );
  }
  if (params.instock) {
    products = products.filter((p) =>
      p.product_variants?.some(isAvailableSizeVariant)
    );
  }
  if (params.sale) {
    products = products.filter((p) => productDiscountPct(p) > 0);
  }
  if (params.sort === "discount") {
    products = [...products].sort(
      (a, b) => productDiscountPct(b) - productDiscountPct(a)
    );
  }

  // Pagination
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = products.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE
  );

  return (
    <div>
      <p className="mb-4 text-xs text-neutral-400">
        Нийт {products.length} бараа
      </p>
      <ProductGrid products={pageItems} />
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          {current > 1 ? (
            <Link
              href={pageHref(params, current - 1)}
              className="btn-outline !px-5 !py-2.5 text-xs"
            >
              <ChevronLeft className="h-4 w-4" /> Өмнөх
            </Link>
          ) : (
            <span
              className={cn(
                "btn-outline pointer-events-none !px-5 !py-2.5 text-xs opacity-40"
              )}
            >
              <ChevronLeft className="h-4 w-4" /> Өмнөх
            </span>
          )}
          <span className="text-sm font-semibold">
            {current} / {totalPages}
          </span>
          {current < totalPages ? (
            <Link
              href={pageHref(params, current + 1)}
              className="btn-outline !px-5 !py-2.5 text-xs"
            >
              Дараах <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span
              className={cn(
                "btn-outline pointer-events-none !px-5 !py-2.5 text-xs opacity-40"
              )}
            >
              Дараах <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: categories }, { data: brands }, { data: sizeVariants }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order"),
      supabase
        .from("brands")
        .select("*")
        .eq("is_visible", true)
        .order("name"),
      supabase
        .from("product_variants")
        .select("size, stock_quantity, status, products!inner(status)")
        .eq("status", "active")
        .gt("stock_quantity", 0)
        .eq("products.status", "published"),
    ]);

  const sizes = uniqueSortedAvailableSizes(sizeVariants ?? []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Дэлгүүр</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Бүх загварууд нэг дор — өөрийн стилийг ол.
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        <SearchFilter
          categories={(categories ?? []) as Category[]}
          brands={(brands ?? []) as Brand[]}
          sizes={sizes}
        />
        <div>
          <Suspense fallback={<GridSkeleton />}>
            <ShopContent params={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
