"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/actions/adminLog";
import { couponSchema } from "@/lib/validation";
import type { Coupon, DiscountType } from "@/types";

const TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Хувь (%)",
  fixed: "Тогтмол дүн (₮)",
  free_shipping: "Үнэгүй хүргэлт",
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CouponForm({
  coupon,
  onClose,
  onSaved,
}: {
  coupon?: Coupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    discount_type: (coupon?.discount_type ?? "percentage") as DiscountType,
    discount_value: coupon?.discount_value?.toString() ?? "",
    min_order_amount: coupon?.min_order_amount?.toString() ?? "0",
    usage_limit: coupon?.usage_limit?.toString() ?? "",
    usage_limit_per_customer:
      coupon?.usage_limit_per_customer?.toString() ?? "",
    starts_at: toLocalInput(coupon?.starts_at),
    ends_at: toLocalInput(coupon?.ends_at),
    is_active: coupon?.is_active ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = couponSchema.safeParse({
      code: form.code.trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value || 0,
      min_order_amount: form.min_order_amount || 0,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      is_active: form.is_active,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Мэдээлэл буруу байна.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const data = {
      ...parsed.data,
      usage_limit_per_customer: form.usage_limit_per_customer
        ? Number(form.usage_limit_per_customer)
        : null,
      starts_at: form.starts_at
        ? new Date(form.starts_at).toISOString()
        : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    };

    try {
      if (coupon) {
        const { error: err } = await supabase
          .from("coupons")
          .update(data)
          .eq("id", coupon.id);
        if (err) throw err;
        await logAdminAction("coupon.update", "coupons", coupon.id, {
          code: data.code,
        });
      } else {
        const { data: created, error: err } = await supabase
          .from("coupons")
          .insert(data)
          .select("id")
          .single();
        if (err) throw err;
        await logAdminAction("coupon.create", "coupons", created.id, {
          code: data.code,
        });
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/50"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        className="fixed inset-x-4 top-[6%] z-50 mx-auto max-h-[88vh] w-auto max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">
            {coupon ? "Купон засах" : "Купон нэмэх"}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-smoke">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Код *</label>
            <input
              className="input font-mono uppercase"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="SUMMER20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Хямдралын төрөл</label>
              <select
                className="input"
                value={form.discount_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_type: e.target.value as DiscountType,
                  })
                }
              >
                {(Object.keys(TYPE_LABELS) as DiscountType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                {form.discount_type === "percentage"
                  ? "Хямдрал (%)"
                  : "Хямдрал (₮)"}
              </label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.discount_value}
                onChange={(e) =>
                  setForm({ ...form, discount_value: e.target.value })
                }
                disabled={form.discount_type === "free_shipping"}
                placeholder={
                  form.discount_type === "percentage" ? "20" : "10000"
                }
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Доод захиалга (₮)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.min_order_amount}
                onChange={(e) =>
                  setForm({ ...form, min_order_amount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Нийт лимит</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.usage_limit}
                onChange={(e) =>
                  setForm({ ...form, usage_limit: e.target.value })
                }
                placeholder="Хязгааргүй"
              />
            </div>
            <div>
              <label className="label">Хэрэглэгч тус бүр</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.usage_limit_per_customer}
                onChange={(e) =>
                  setForm({
                    ...form,
                    usage_limit_per_customer: e.target.value,
                  })
                }
                placeholder="Хязгааргүй"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Эхлэх огноо</label>
              <input
                type="datetime-local"
                className="input"
                value={form.starts_at}
                onChange={(e) =>
                  setForm({ ...form, starts_at: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Дуусах огноо</label>
              <input
                type="datetime-local"
                className="input"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm font-medium">Идэвхтэй</span>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="h-5 w-5 accent-ink"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-neon w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Хадгалах
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
