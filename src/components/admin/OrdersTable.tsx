"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Order } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatDate, formatPrice } from "@/utils/format";
import { StatusBadge, PaymentBadge } from "./StatusBadge";

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (!orders.length) {
    return (
      <p className="py-12 text-center text-sm text-neutral-400">
        Захиалга алга байна.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">Захиалга</th>
            <th className="px-4 py-3">Хэрэглэгч</th>
            <th className="px-4 py-3">Төлбөр</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3 text-right">Дүн</th>
            <th className="px-4 py-3">Огноо</th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {orders.map((order, i) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="transition-colors hover:bg-smoke/50"
            >
              <td className="px-4 py-3 font-semibold">{order.order_number}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-xs text-neutral-400">{order.phone}</p>
              </td>
              <td className="px-4 py-3">
                <PaymentBadge status={order.payment_status} />
                <p className="mt-1 text-[10px] text-neutral-400">
                  {PAYMENT_METHOD_LABELS[order.payment_method]}
                </p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.order_status} />
              </td>
              <td className="px-4 py-3 text-right font-bold">
                {formatPrice(Number(order.total_amount))}
              </td>
              <td className="px-4 py-3 text-xs text-neutral-400">
                {formatDate(order.created_at)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="inline-flex rounded-full p-2 hover:bg-smoke"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
