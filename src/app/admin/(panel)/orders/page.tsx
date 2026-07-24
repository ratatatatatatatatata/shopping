import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/types";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { OrdersCsvButton } from "@/components/admin/OrdersCsvButton";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STATUSES: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "all") query = query.eq("order_status", status);
  if (q?.trim()) {
    const term = q.trim().replace(/[%,()]/g, "");
    query = query.or(`order_number.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data } = await query;
  const orders = (data ?? []) as Order[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Захиалга</h1>
        <OrdersCsvButton orders={orders} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const active = (status ?? "all") === s;
            const params = new URLSearchParams();
            if (s !== "all") params.set("status", s);
            if (q) params.set("q", q);
            const qs = params.toString();
            return (
              <Link
                key={s}
                href={qs ? `/admin/orders?${qs}` : "/admin/orders"}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-ink/10 bg-white hover:border-ink"
                }`}
              >
                {s === "all" ? "Бүгд" : ORDER_STATUS_LABELS[s]}
              </Link>
            );
          })}
        </div>
        <form action="/admin/orders" className="ml-auto flex items-center gap-2">
          {status && status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Дугаар, утас хайх..."
              className="input !w-56 !py-2 !pl-9 text-xs"
            />
          </div>
          <button type="submit" className="btn-outline !px-4 !py-2 text-xs">
            Хайх
          </button>
        </form>
      </div>

      <div className="card">
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}
