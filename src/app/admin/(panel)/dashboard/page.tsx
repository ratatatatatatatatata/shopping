import Link from "next/link";
import {
  ShoppingCart,
  Banknote,
  Clock,
  CheckCircle2,
  Users,
  Package,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Order, Product } from "@/types";
import { StatsCard } from "@/components/admin/StatsCard";
import { SalesChart, type DailySale } from "@/components/admin/SalesChart";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/utils/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    ordersRes,
    pendingRes,
    deliveredRes,
    customersRes,
    productsRes,
    lowStockRes,
    outOfStockRes,
    bestRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .gte("created_at", monthStart.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "delivered"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("product_variants")
      .select("id, size, stock_quantity, sku, products(name)")
      .lte("stock_quantity", LOW_STOCK_THRESHOLD)
      .order("stock_quantity")
      .limit(8),
    supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("stock_quantity", 0),
    supabase.from("best_sellers").select("*").limit(5),
  ]);

  const orders = (ordersRes.data ?? []) as Order[];
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const monthRevenue = paidOrders.reduce(
    (s, o) => s + Number(o.total_amount),
    0
  );
  const newOrders = orders.filter((o) => o.order_status === "pending");

  // Daily sales for the chart (paid orders, this month)
  const daily = new Map<string, { amount: number; orders: number }>();
  const daysInMonth = new Date().getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    daily.set(String(d).padStart(2, "0"), { amount: 0, orders: 0 });
  }
  for (const o of paidOrders) {
    const day = String(new Date(o.created_at).getDate()).padStart(2, "0");
    const cur = daily.get(day) ?? { amount: 0, orders: 0 };
    daily.set(day, {
      amount: cur.amount + Number(o.total_amount),
      orders: cur.orders + 1,
    });
  }
  const chartData: DailySale[] = Array.from(daily.entries()).map(
    ([date, v]) => ({ date, ...v })
  );

  const lowStock = lowStockRes.data ?? [];
  const bestSellers = (bestRes.data ?? []) as (Product & {
    total_sold: number;
  })[];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          index={0}
          title="Энэ сарын орлого"
          value={formatPrice(monthRevenue)}
          icon={Banknote}
          accent="neon"
        />
        <StatsCard
          index={1}
          title="Энэ сарын захиалга"
          value={String(orders.length)}
          icon={ShoppingCart}
          accent="electric"
        />
        <StatsCard
          index={2}
          title="Хүлээгдэж буй захиалга"
          value={String(pendingRes.count ?? 0)}
          icon={Clock}
          accent="grape"
        />
        <StatsCard
          index={3}
          title="Хүргэгдсэн захиалга"
          value={String(deliveredRes.count ?? 0)}
          icon={CheckCircle2}
          accent="neon"
        />
        <StatsCard
          index={4}
          title="Нийт хэрэглэгч"
          value={String(customersRes.count ?? 0)}
          icon={Users}
          accent="electric"
        />
        <StatsCard
          index={5}
          title="Нийт бараа"
          value={String(productsRes.count ?? 0)}
          icon={Package}
          accent="grape"
        />
        <StatsCard
          index={6}
          title="Бага үлдэгдэлтэй хувилбар"
          value={String(lowStock.length)}
          icon={AlertTriangle}
          accent="red"
        />
        <StatsCard
          index={7}
          title="Дууссан үлдэгдэлтэй"
          value={String(outOfStockRes.count ?? 0)}
          icon={PackageX}
          accent="red"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Chart */}
        <div className="card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">
              Энэ сарын борлуулалт
            </h2>
            <span className="rounded-full bg-neon/20 px-3 py-1 text-xs font-semibold text-lime-700">
              {paidOrders.length} төлөгдсөн захиалга
            </span>
          </div>
          <SalesChart data={chartData} />
        </div>

        {/* Low stock + best sellers */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Бага
              үлдэгдэлтэй
            </h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-neutral-400">Бүх бараа хангалттай.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStock.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">
                      {(v.products as unknown as { name: string })?.name} ·{" "}
                      {v.size}
                    </span>
                    <span
                      className={`font-bold ${v.stock_quantity === 0 ? "text-red-500" : "text-amber-600"}`}
                    >
                      {v.stock_quantity} ш
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Эрэлттэй
              бараа
            </h2>
            {bestSellers.length === 0 ? (
              <p className="text-sm text-neutral-400">Мэдээлэл алга.</p>
            ) : (
              <div className="space-y-2.5">
                {bestSellers.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">
                      <span className="mr-2 font-bold text-neutral-300">
                        {i + 1}
                      </span>
                      {p.name}
                    </span>
                    <span className="font-semibold text-neutral-500">
                      {p.total_sold} зарагдсан
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">
            Сүүлийн захиалгууд{" "}
            {newOrders.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                {newOrders.length} шинэ
              </span>
            )}
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-electric hover:underline"
          >
            Бүгдийг үзэх
          </Link>
        </div>
        <OrdersTable orders={orders.slice(0, 8)} />
      </div>
    </div>
  );
}
