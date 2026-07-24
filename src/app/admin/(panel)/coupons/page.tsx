"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/actions/adminLog";
import { CouponForm } from "@/components/admin/CouponForm";
import type { Coupon, DiscountType } from "@/types";
import { formatPrice } from "@/utils/format";

const TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Хувь",
  fixed: "Тогтмол дүн",
  free_shipping: "Үнэгүй хүргэлт",
};

function formatValue(c: Coupon): string {
  if (c.discount_type === "percentage") return `${Number(c.discount_value)}%`;
  if (c.discount_type === "fixed")
    return formatPrice(Number(c.discount_value));
  return "—";
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("mn-MN");
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons((data ?? []) as Coupon[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(c: Coupon) {
    setRowLoading(c.id);
    const supabase = createClient();
    await supabase
      .from("coupons")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    await logAdminAction("coupon.toggle_active", "coupons", c.id, {
      code: c.code,
      is_active: !c.is_active,
    });
    setRowLoading(null);
    load();
  }

  async function handleDelete(c: Coupon) {
    if (!confirm(`"${c.code}" купоныг устгах уу?`)) return;
    setRowLoading(c.id);
    const supabase = createClient();
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) alert("Устгахад алдаа гарлаа: " + error.message);
    else
      await logAdminAction("coupon.delete", "coupons", c.id, {
        code: c.code,
      });
    setRowLoading(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">
          Купон ({coupons.length})
        </h1>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn-neon !py-2.5"
        >
          <Plus className="h-4 w-4" /> Купон нэмэх
        </button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
          </div>
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Төрөл</th>
                <th className="px-4 py-3 text-right">Хямдрал</th>
                <th className="px-4 py-3 text-right">Доод дүн</th>
                <th className="px-4 py-3 text-center">Ашиглалт</th>
                <th className="px-4 py-3">Хугацаа</th>
                <th className="px-4 py-3 text-center">Идэвхтэй</th>
                <th className="px-4 py-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {coupons.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-neutral-400"
                  >
                    Купон алга байна.
                  </td>
                </tr>
              )}
              {coupons.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-smoke/50">
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {TYPE_LABELS[c.discount_type]}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatValue(c)}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500">
                    {Number(c.min_order_amount) > 0
                      ? formatPrice(Number(c.min_order_amount))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-500">
                    {c.used_count} / {c.usage_limit ?? "∞"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">
                    {formatShortDate(c.starts_at)} —{" "}
                    {formatShortDate(c.ends_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(c)}
                      disabled={rowLoading === c.id}
                      role="switch"
                      aria-checked={c.is_active}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        c.is_active ? "bg-emerald-500" : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          c.is_active ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {rowLoading === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditing(c);
                              setFormOpen(true);
                            }}
                            className="rounded-full p-2 text-neutral-500 hover:bg-smoke"
                            title="Засах"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="rounded-full p-2 text-red-500 hover:bg-red-50"
                            title="Устгах"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <CouponForm
          coupon={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
