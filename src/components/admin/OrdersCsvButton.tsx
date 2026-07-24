"use client";

import { Download } from "lucide-react";
import type { Order } from "@/types";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function OrdersCsvButton({ orders }: { orders: Order[] }) {
  function exportCsv() {
    const header = [
      "order_number",
      "date",
      "customer",
      "phone",
      "status",
      "payment",
      "total",
    ];
    const rows = orders.map((o) => [
      o.order_number,
      new Date(o.created_at).toISOString(),
      o.customer_name,
      o.phone,
      ORDER_STATUS_LABELS[o.order_status],
      PAYMENT_STATUS_LABELS[o.payment_status],
      String(o.total_amount),
    ]);
    const csv =
      String.fromCharCode(0xfeff) + // UTF-8 BOM so Excel opens Cyrillic correctly
      [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orasuits-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportCsv}
      disabled={!orders.length}
      className="btn-outline !py-2 text-xs disabled:opacity-40"
    >
      <Download className="h-4 w-4" /> CSV татах
    </button>
  );
}
