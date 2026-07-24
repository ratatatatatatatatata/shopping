import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductStatus } from "@/types";
import { effectivePrice } from "@/types";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/utils/format";

export const dynamic = "force-dynamic";

const STATUS_TABS: (ProductStatus | "all")[] = [
  "all",
  "draft",
  "published",
  "archived",
];

const STATUS_BADGE: Record<ProductStatus, string> = {
  draft: "bg-neutral-200 text-neutral-600",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-neutral-100 text-neutral-400",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      "*, categories(name), product_colors(id), product_variants(stock_quantity)"
    )
    .order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);

  const { data } = await query;
  const products = (data ?? []) as Product[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">
          Бараа ({products.length})
        </h1>
        <Link href="/admin/products/new" className="btn-neon !py-2.5">
          <Plus className="h-4 w-4" /> Бараа нэмэх
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => {
          const active = (status ?? "all") === s;
          return (
            <Link
              key={s}
              href={
                s === "all" ? "/admin/products" : `/admin/products?status=${s}`
              }
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-white hover:border-ink"
              }`}
            >
              {s === "all" ? "Бүгд" : PRODUCT_STATUS_LABELS[s]}
            </Link>
          );
        })}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Бараа</th>
              <th className="px-4 py-3 text-center">Төлөв</th>
              <th className="px-4 py-3">Ангилал</th>
              <th className="px-4 py-3 text-right">Үнэ</th>
              <th className="px-4 py-3 text-center">Үлдэгдэл</th>
              <th className="px-4 py-3 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-neutral-400"
                >
                  Бараа алга байна.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const totalStock = (p.product_variants ?? []).reduce(
                (s, v) => s + v.stock_quantity,
                0
              );
              const price = effectivePrice(p);
              const onSale = price !== Number(p.base_price);
              return (
                <tr key={p.id} className="transition-colors hover:bg-smoke/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.main_image_url ?? ""}
                        alt=""
                        className="h-12 w-10 rounded-lg bg-smoke object-cover"
                      />
                      <div>
                        <span className="font-semibold">{p.name}</span>
                        {p.sku && (
                          <p className="text-[11px] text-neutral-400">
                            {p.sku}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[p.status]}`}
                    >
                      {PRODUCT_STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {(p.categories as unknown as { name: string })?.name ??
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {onSale ? (
                      <>
                        <span className="font-semibold text-red-500">
                          {formatPrice(price)}
                        </span>
                        <p className="text-[11px] text-neutral-400 line-through">
                          {formatPrice(Number(p.base_price))}
                        </p>
                      </>
                    ) : (
                      <span className="font-medium">
                        {formatPrice(Number(p.base_price))}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${totalStock <= 5 ? "text-red-500" : ""}`}
                    >
                      {totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions
                      productId={p.id}
                      slug={p.slug}
                      name={p.name}
                      status={p.status}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
