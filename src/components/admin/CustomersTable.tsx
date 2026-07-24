"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Save,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/actions/adminLog";
import type { OrderStatus, PaymentStatus, Profile } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatPrice } from "@/utils/format";

export interface CustomerOrder {
  id: string;
  user_id: string | null;
  order_number: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
}

export function CustomersTable({
  customers,
  orders,
}: {
  customers: Profile[];
  orders: CustomerOrder[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const ordersByUser = useMemo(() => {
    const map = new Map<string, CustomerOrder[]>();
    for (const o of orders) {
      if (!o.user_id) continue;
      const list = map.get(o.user_id) ?? [];
      list.push(o);
      map.set(o.user_id, list);
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        (c.full_name ?? "").toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term)
    );
  }, [customers, search]);

  function toggleExpand(c: Profile) {
    if (expandedId === c.id) {
      setExpandedId(null);
    } else {
      setExpandedId(c.id);
      setNoteDraft(c.internal_note ?? "");
    }
  }

  async function saveNote(c: Profile) {
    setLoading(c.id);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ internal_note: noteDraft.trim() || null })
      .eq("id", c.id);
    await logAdminAction("customer.note", "profiles", c.id, {
      email: c.email,
    });
    setLoading(null);
    router.refresh();
  }

  async function toggleDisabled(c: Profile) {
    const action = c.is_disabled ? "идэвхжүүлэх" : "идэвхгүй болгох";
    if (!confirm(`${c.email ?? c.full_name ?? "Хэрэглэгч"}-г ${action} уу?`))
      return;
    setLoading(c.id);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ is_disabled: !c.is_disabled })
      .eq("id", c.id);
    await logAdminAction(
      c.is_disabled ? "customer.enable" : "customer.disable",
      "profiles",
      c.id,
      { email: c.email }
    );
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр, и-мэйлээр хайх..."
          className="input !py-2.5 !pl-9 text-sm"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Хэрэглэгч</th>
              <th className="px-4 py-3">Утас</th>
              <th className="px-4 py-3">Бүртгүүлсэн</th>
              <th className="px-4 py-3 text-center">Захиалга</th>
              <th className="px-4 py-3 text-right">Нийт худалдан авалт</th>
              <th className="px-4 py-3 text-center">Төлөв</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-neutral-400"
                >
                  Хэрэглэгч олдсонгүй.
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const userOrders = ordersByUser.get(c.id) ?? [];
              const totalSpent = userOrders
                .filter((o) => o.payment_status === "paid")
                .reduce((s, o) => s + Number(o.total_amount), 0);
              const expanded = expandedId === c.id;
              return (
                <Fragment key={c.id}>
                  <tr
                    onClick={() => toggleExpand(c)}
                    className="cursor-pointer transition-colors hover:bg-smoke/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{c.full_name || "—"}</p>
                      <p className="text-xs text-neutral-400">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {c.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {userOrders.length}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatPrice(totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          c.is_disabled
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {c.is_disabled ? "Идэвхгүй" : "Идэвхтэй"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronDown
                        className={`h-4 w-4 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={7} className="bg-smoke/40 px-6 py-5">
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid gap-6 lg:grid-cols-2"
                          >
                            {/* Order history */}
                            <div>
                              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-400">
                                Захиалгын түүх
                              </h3>
                              {userOrders.length === 0 ? (
                                <p className="text-sm text-neutral-400">
                                  Захиалга алга.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {userOrders.slice(0, 8).map((o) => (
                                    <Link
                                      key={o.id}
                                      href={`/admin/orders/${o.id}`}
                                      className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm transition-shadow hover:shadow"
                                    >
                                      <span className="font-semibold">
                                        {o.order_number}
                                      </span>
                                      <span className="text-xs text-neutral-400">
                                        {ORDER_STATUS_LABELS[o.order_status]}
                                      </span>
                                      <span className="font-bold">
                                        {formatPrice(Number(o.total_amount))}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Note + disable */}
                            <div className="space-y-3">
                              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                                Дотоод тэмдэглэл
                              </h3>
                              <textarea
                                className="input min-h-[90px] bg-white text-xs"
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                placeholder="Зөвхөн админд харагдана..."
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => saveNote(c)}
                                  disabled={loading === c.id}
                                  className="btn-outline !py-2 text-xs"
                                >
                                  {loading === c.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Save className="h-3.5 w-3.5" />
                                  )}
                                  Тэмдэглэл хадгалах
                                </button>
                                <button
                                  onClick={() => toggleDisabled(c)}
                                  disabled={loading === c.id}
                                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                                    c.is_disabled
                                      ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                      : "border-red-200 text-red-600 hover:bg-red-50"
                                  }`}
                                >
                                  {c.is_disabled ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Идэвхжүүлэх
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-3.5 w-3.5" />
                                      Идэвхгүй болгох
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
