import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types";
import { StatsCard } from "@/components/admin/StatsCard";
import { SalesChart, type DailySale } from "@/components/admin/SalesChart";
import { formatPrice } from "@/utils/format";

export const dynamic = "force-dynamic";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const now = new Date();
  const selected =
    month && /^\d{4}-\d{2}$/.test(month) ? month : monthKey(now);
  const [yearStr, monthStr] = selected.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
  const isCurrentMonth = selected === monthKey(now);
  const daysInMonth = isCurrentMonth
    ? now.getDate()
    : new Date(year, monthIndex + 1, 0).getDate();

  const supabase = await createClient();
  const { data: ordersData } = await supabase
    .from("orders")
    .select("*, order_items(*, products(category_id, categories(name)))")
    .gte("created_at", monthStart.toISOString())
    .lt("created_at", monthEnd.toISOString())
    .eq("payment_status", "paid")
    .order("created_at");

  const orders = (ordersData ?? []) as (Order & {
    order_items: (OrderItem & {
      products: {
        category_id: string;
        categories: { name: string } | null;
      } | null;
    })[];
  })[];

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const avgOrder = orders.length ? totalRevenue / orders.length : 0;

  // Daily sales
  const daily = new Map<string, { amount: number; orders: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    daily.set(String(d).padStart(2, "0"), { amount: 0, orders: 0 });
  }
  for (const o of orders) {
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

  // Product sales + category revenue
  const productSales = new Map<string, { qty: number; revenue: number }>();
  const categoryRevenue = new Map<string, number>();
  let itemsSold = 0;
  for (const o of orders) {
    for (const item of o.order_items ?? []) {
      itemsSold += item.quantity;
      const cur = productSales.get(item.product_name) ?? {
        qty: 0,
        revenue: 0,
      };
      productSales.set(item.product_name, {
        qty: cur.qty + item.quantity,
        revenue: cur.revenue + Number(item.total_price),
      });
      const catName = item.products?.categories?.name ?? "Бусад";
      categoryRevenue.set(
        catName,
        (categoryRevenue.get(catName) ?? 0) + Number(item.total_price)
      );
    }
  }

  const topProducts = Array.from(productSales.entries())
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 10);
  const categories = Array.from(categoryRevenue.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const maxCatRevenue = categories[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Борлуулалт</h1>
        <form action="/admin/sales" className="flex items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={selected}
            max={monthKey(now)}
            className="input !w-44 !py-2 text-xs"
          />
          <button type="submit" className="btn-outline !px-4 !py-2 text-xs">
            Харах
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          index={0}
          title="Нийт орлого"
          value={formatPrice(totalRevenue)}
          icon="banknote"
          accent="neon"
        />
        <StatsCard
          index={1}
          title="Төлөгдсөн захиалга"
          value={String(orders.length)}
          icon="cart"
          accent="electric"
        />
        <StatsCard
          index={2}
          title="Дундаж захиалга"
          value={formatPrice(Math.round(avgOrder))}
          icon="trending"
          accent="grape"
        />
        <StatsCard
          index={3}
          title="Зарагдсан бараа"
          value={String(itemsSold)}
          icon="layers"
          accent="electric"
        />
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-display text-lg font-bold">
          Өдрийн борлуулалт — {selected}
        </h2>
        <SalesChart data={chartData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">
            Эрэлттэй бараа (топ 10)
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Энэ сард борлуулалт алга.
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map(([name, stats], i) => (
                <div
                  key={name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    <span className="mr-2 font-bold text-neutral-300">
                      {i + 1}
                    </span>
                    {name}
                  </span>
                  <span className="text-neutral-500">
                    {stats.qty} ш ·{" "}
                    <span className="font-bold text-ink">
                      {formatPrice(stats.revenue)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">
            Ангиллын орлого
          </h2>
          {categories.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Энэ сард борлуулалт алга.
            </p>
          ) : (
            <div className="space-y-4">
              {categories.map(([name, revenue]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="font-bold">{formatPrice(revenue)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-smoke">
                    <div
                      className="h-full rounded-full bg-accent-gradient"
                      style={{ width: `${(revenue / maxCatRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
