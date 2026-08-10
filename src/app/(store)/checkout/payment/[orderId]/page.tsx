import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";
import { QPayBox } from "@/components/store/QPayBox";
import { BankTransferBox } from "@/components/store/BankTransferBox";
import {
  PAYMENT_METHOD_LABELS,
  DELIVERY_METHOD_LABELS,
} from "@/lib/constants";
import { formatPrice } from "@/utils/format";

export const metadata = { title: "Төлбөр" };
export const dynamic = "force-dynamic";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!data) notFound();
  const order = data as Order;

  const addressLine = [
    order.city,
    order.district,
    order.khoroo ? `${order.khoroo}-р хороо` : null,
    order.address_detail,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="font-display text-2xl font-bold">
          Захиалга амжилттай үүслээ!
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Захиалгын дугаар:{" "}
          <span className="font-bold text-ink">{order.order_number}</span>
        </p>
      </div>

      {order.payment_method === "qpay" && (
        <QPayBox
          amount={Number(order.total_amount)}
          orderNumber={order.order_number}
        />
      )}
      {order.payment_method === "bank_transfer" && (
        <BankTransferBox
          amount={Number(order.total_amount)}
          orderNumber={order.order_number}
        />
      )}
      {order.payment_method === "cod" && (
        <div className="card p-6 text-center">
          <h3 className="font-display text-lg font-bold">Бэлнээр төлөх</h3>
          <p className="mt-3 text-sm text-neutral-600">
            Та захиалгаа хүлээн авахдаа{" "}
            <span className="font-bold">
              {formatPrice(Number(order.total_amount))}
            </span>{" "}
            бэлнээр төлнө үү.
          </p>
        </div>
      )}
      {order.payment_method === "online" && (
        <div className="card p-6 text-center">
          <h3 className="font-display text-lg font-bold">Онлайн төлбөр</h3>
          <p className="mt-3 text-sm text-neutral-600">
            Онлайн төлбөрийн холбоос удахгүй и-мэйлээр илгээгдэнэ.
          </p>
        </div>
      )}

      <div className="card mt-6 p-6">
        <h3 className="mb-4 font-display font-bold">Захиалгын дэлгэрэнгүй</h3>
        <div className="space-y-2 text-sm">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span className="text-neutral-600">
                {item.product_name} ({item.color_name}, {item.size}) ×{" "}
                {item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(Number(item.total_price))}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-ink/5 pt-2 text-neutral-500">
            <span>Барааны дүн</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between font-medium text-emerald-600">
              <span>
                Хөнгөлөлт
                {order.coupon_code ? ` (${order.coupon_code})` : ""}
              </span>
              <span>-{formatPrice(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="flex justify-between text-neutral-500">
            <span>Хүргэлт · {DELIVERY_METHOD_LABELS[order.delivery_method]}</span>
            <span>
              {Number(order.delivery_fee) === 0
                ? "Үнэгүй"
                : formatPrice(Number(order.delivery_fee))}
            </span>
          </div>
          <div className="flex justify-between font-display text-base font-bold">
            <span>Нийт</span>
            <span>{formatPrice(Number(order.total_amount))}</span>
          </div>
          <div className="flex justify-between pt-2 text-xs text-neutral-400">
            <span>Төлбөрийн хэлбэр</span>
            <span>{PAYMENT_METHOD_LABELS[order.payment_method]}</span>
          </div>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
          <MapPin className="h-4 w-4 text-electric" /> Хүргэлтийн хаяг
        </h3>
        <p className="text-sm text-neutral-600">{addressLine}</p>
        <p className="mt-1 text-xs text-neutral-400">
          {order.customer_name} · {order.phone}
        </p>
        {order.delivery_note && (
          <p className="mt-2 rounded-xl bg-smoke p-3 text-xs text-neutral-500">
            {order.delivery_note}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className="btn-primary">
          Захиалга хянах
        </Link>
        <Link href="/shop" className="btn-outline">
          Дэлгүүр рүү буцах
        </Link>
      </div>
    </div>
  );
}
