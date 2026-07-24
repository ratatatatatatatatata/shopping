import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import { formatDate, formatPrice } from "@/utils/format";
import { EmptyState } from "@/components/store/EmptyState";

export const metadata = { title: "Захиалгын түүх" };
export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account/orders");

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as Order[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Миний бүртгэл
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold">Захиалгын түүх</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="Захиалга алга байна"
          description="Та одоогоор захиалга хийгээгүй байна."
          actionLabel="Дэлгүүр үзэх"
          actionHref="/shop"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/checkout/payment/${order.id}`}
              className="card block p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold">
                      {order.order_number}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ORDER_STATUS_COLORS[order.order_status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.order_status]}
                    </span>
                    {order.tracking_number && (
                      <span className="rounded-full bg-smoke px-2.5 py-0.5 text-[11px] font-medium text-neutral-500">
                        {order.tracking_number}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatDate(order.created_at)} ·{" "}
                    {PAYMENT_METHOD_LABELS[order.payment_method]} ·{" "}
                    {order.order_items?.length ?? 0} бараа
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold">
                    {formatPrice(Number(order.total_amount))}
                  </span>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
