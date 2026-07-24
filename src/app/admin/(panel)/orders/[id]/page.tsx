import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";
import { StatusBadge, PaymentBadge } from "@/components/admin/StatusBadge";
import { OrderStatusManager } from "@/components/admin/OrderStatusManager";
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import { formatDate, formatPrice } from "@/utils/format";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const order = data as Order;

  const address = [order.city, order.district, order.khoroo]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6" id="invoice-area">
      {/* Print stylesheet: hide chrome, show the invoice content only */}
      <style>{`
        @media print {
          aside, header, nav { display: none !important; }
          .print\\:hidden { display: none !important; }
          .lg\\:pl-60 { padding-left: 0 !important; }
          main { padding: 0 !important; }
          body { background: #fff !important; }
          .card { box-shadow: none !important; border: 1px solid #e5e5e5 !important; }
        }
      `}</style>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/orders"
          className="rounded-full border border-ink/10 p-2 hover:border-ink print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold">
          {order.order_number}
        </h1>
        <StatusBadge status={order.order_status} />
        <PaymentBadge status={order.payment_status} />
        {order.tracking_number && (
          <span className="rounded-full bg-smoke px-3 py-1 text-xs font-semibold text-neutral-600">
            {order.tracking_number}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <div className="card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Бараанууд</h2>
            <div className="divide-y divide-ink/5">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-xs text-neutral-500">
                      {[item.color_name, item.size].filter(Boolean).join(" · ")}{" "}
                      · {formatPrice(Number(item.unit_price))} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold">
                    {formatPrice(Number(item.total_price))}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-ink/5 pt-4 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Барааны дүн</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>
                    Хямдрал
                    {order.coupon_code ? ` (${order.coupon_code})` : ""}
                  </span>
                  <span>-{formatPrice(Number(order.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Хүргэлт</span>
                <span>{formatPrice(Number(order.delivery_fee))}</span>
              </div>
              <div className="flex justify-between font-display text-lg font-bold">
                <span>Нийт</span>
                <span>{formatPrice(Number(order.total_amount))}</span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">
              Хэрэглэгчийн мэдээлэл
            </h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-neutral-400">Нэр</dt>
                <dd className="font-semibold">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-400">Утас</dt>
                <dd className="font-semibold">{order.phone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-400">И-мэйл</dt>
                <dd className="font-semibold">{order.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-400">
                  Хүргэлтийн хэлбэр
                </dt>
                <dd className="font-semibold">
                  {DELIVERY_METHOD_LABELS[order.delivery_method] ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-400">
                  Хот / Дүүрэг / Хороо
                </dt>
                <dd className="font-semibold">{address || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-400">
                  Дэлгэрэнгүй хаяг
                </dt>
                <dd className="font-semibold">{order.address_detail}</dd>
              </div>
              {order.delivery_note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-neutral-400">
                    Хүргэлтийн тэмдэглэл
                  </dt>
                  <dd>{order.delivery_note}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <OrderStatusManager order={order} />
          <div className="card p-6 text-sm">
            <h2 className="mb-3 font-display text-base font-bold">Төлбөр</h2>
            <div className="space-y-2 text-neutral-600">
              <div className="flex justify-between">
                <span>Хэлбэр</span>
                <span className="font-semibold">
                  {PAYMENT_METHOD_LABELS[order.payment_method]}
                </span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between">
                  <span>Купон</span>
                  <span className="font-semibold">{order.coupon_code}</span>
                </div>
              )}
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <span>Хямдрал</span>
                  <span className="font-semibold text-red-500">
                    -{formatPrice(Number(order.discount_amount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Огноо</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
