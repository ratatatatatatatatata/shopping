"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Printer, XCircle, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/actions/adminLog";
import type { Order, OrderStatus, PaymentStatus } from "@/types";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";

export function OrderStatusManager({ order }: { order: Order }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(
    order.tracking_number ?? ""
  );
  const [internalNote, setInternalNote] = useState(order.internal_note ?? "");
  const [error, setError] = useState<string | null>(null);

  async function updateOrderStatus(orderStatus: OrderStatus) {
    if (orderStatus === "cancelled") {
      await cancelOrder();
      return;
    }
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ order_status: orderStatus })
      .eq("id", order.id);
    await logAdminAction("order.status", "orders", order.id, {
      order_number: order.order_number,
      status: orderStatus,
    });
    setLoading(false);
    router.refresh();
  }

  async function updatePaymentStatus(paymentStatus: PaymentStatus) {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", order.id);
    await logAdminAction("order.payment_status", "orders", order.id, {
      order_number: order.order_number,
      payment_status: paymentStatus,
    });
    setLoading(false);
    router.refresh();
  }

  async function confirmPayment() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        order_status:
          order.order_status === "pending" ? "confirmed" : order.order_status,
      })
      .eq("id", order.id);
    await supabase
      .from("payments")
      .update({ status: "paid" })
      .eq("order_id", order.id);
    await logAdminAction("order.confirm_payment", "orders", order.id, {
      order_number: order.order_number,
    });
    setLoading(false);
    router.refresh();
  }

  async function cancelOrder() {
    if (order.order_status === "cancelled") return;
    if (
      !confirm(
        "Захиалгыг цуцлах уу? Барааны үлдэгдэл агуулах руу буцаан орно."
      )
    ) {
      router.refresh();
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error: err } = await supabase
        .from("orders")
        .update({ order_status: "cancelled" })
        .eq("id", order.id);
      if (err) throw err;

      // Restore stock for every item that has a variant
      for (const item of order.order_items ?? []) {
        if (!item.variant_id) continue;
        const { error: rpcErr } = await supabase.rpc("adjust_stock", {
          p_variant_id: item.variant_id,
          p_change: item.quantity,
          p_type: "order_cancelled",
          p_order_id: order.id,
          p_note: `Захиалга ${order.order_number} цуцлагдсан`,
        });
        if (rpcErr) throw rpcErr;
      }
      await logAdminAction("order.cancel", "orders", order.id, {
        order_number: order.order_number,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Цуцлахад алдаа гарлаа."
      );
    }
    setLoading(false);
    router.refresh();
  }

  async function saveTracking() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber.trim() || null })
      .eq("id", order.id);
    await logAdminAction("order.tracking", "orders", order.id, {
      order_number: order.order_number,
      tracking_number: trackingNumber.trim(),
    });
    setLoading(false);
    router.refresh();
  }

  async function saveNote() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ internal_note: internalNote.trim() || null })
      .eq("id", order.id);
    await logAdminAction("order.note", "orders", order.id, {
      order_number: order.order_number,
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="card space-y-4 p-6 print:hidden">
      <h2 className="font-display text-lg font-bold">Статус удирдах</h2>

      {order.payment_status !== "paid" &&
        order.order_status !== "cancelled" && (
          <button
            onClick={confirmPayment}
            disabled={loading}
            className="btn-neon w-full !py-3"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Төлбөр баталгаажуулах
          </button>
        )}

      <div>
        <label className="label">Захиалгын статус</label>
        <select
          className="input cursor-pointer"
          value={order.order_status}
          disabled={loading}
          onChange={(e) => updateOrderStatus(e.target.value as OrderStatus)}
        >
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Төлбөрийн статус</label>
        <select
          className="input cursor-pointer"
          value={order.payment_status}
          disabled={loading}
          onChange={(e) =>
            updatePaymentStatus(e.target.value as PaymentStatus)
          }
        >
          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Хүргэлтийн код (tracking)</label>
        <div className="flex gap-2">
          <input
            className="input flex-1 !py-2"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="TRK-000000"
          />
          <button
            onClick={saveTracking}
            disabled={loading}
            className="btn-outline !px-3 !py-2"
            title="Хадгалах"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="label">Дотоод тэмдэглэл</label>
        <textarea
          className="input min-h-[80px] text-xs"
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder="Зөвхөн админд харагдана..."
        />
        <button
          onClick={saveNote}
          disabled={loading}
          className="btn-outline mt-2 w-full !py-2 text-xs"
        >
          <Save className="h-3.5 w-3.5" /> Тэмдэглэл хадгалах
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-2 border-t border-ink/5 pt-4">
        <button
          onClick={() => window.print()}
          className="btn-outline w-full !py-2.5 text-xs"
        >
          <Printer className="h-4 w-4" /> Нэхэмжлэх хэвлэх
        </button>
        {order.order_status !== "cancelled" && (
          <button
            onClick={cancelOrder}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" /> Захиалга цуцлах
          </button>
        )}
      </div>
    </div>
  );
}
