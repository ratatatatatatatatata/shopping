"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, MapPin, Plus, Trash2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { DISTRICTS } from "@/lib/constants";
import type { Address } from "@/types";
import { cn } from "@/utils/format";

const CITIES = ["Улаанбаатар", "Орон нутаг"];

const EMPTY_ADDRESS = {
  label: "",
  fullName: "",
  phone: "",
  city: "Улаанбаатар",
  district: DISTRICTS[0],
  khoroo: "",
  addressDetail: "",
};

export default function ProfilePage() {
  const { user, profile, loading } = useUser();
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.full_name ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses((data ?? []) as Address[]);
    setAddrLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadAddresses();
    else if (!loading) setAddrLoading(false);
  }, [user, loading, loadAddresses]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ full_name: form.fullName, phone: form.phone })
      .eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setAddrError(null);
    if (!addrForm.fullName.trim() || !addrForm.phone.trim() || !addrForm.addressDetail.trim()) {
      setAddrError("Нэр, утас, дэлгэрэнгүй хаягаа бөглөнө үү.");
      return;
    }
    setAddrSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: addrForm.label || null,
      full_name: addrForm.fullName,
      phone: addrForm.phone,
      city: addrForm.city,
      district: addrForm.district,
      khoroo: addrForm.khoroo,
      address_detail: addrForm.addressDetail,
      is_default: addresses.length === 0,
    });
    setAddrSaving(false);
    if (error) {
      setAddrError("Хаяг хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
      return;
    }
    setAddrForm(EMPTY_ADDRESS);
    setShowAddForm(false);
    loadAddresses();
  }

  async function handleSetDefault(id: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    loadAddresses();
  }

  async function handleDeleteAddress(id: string) {
    const supabase = createClient();
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold">Нэвтрээгүй байна</h1>
        <Link href="/login?redirect=/account/profile" className="btn-primary mt-6">
          Нэвтрэх
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Миний бүртгэл
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold">Хувийн мэдээлэл</h1>

      {/* Profile form */}
      <div className="card mt-8 p-6">
        <h2 className="mb-5 font-display text-lg font-bold">Профайл</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">И-мэйл</label>
            <input className="input opacity-60" value={user.email ?? ""} disabled />
          </div>
          <div>
            <label className="label">Нэр</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Утас</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saved ? "Хадгалагдлаа!" : "Хадгалах"}
          </button>
        </form>
      </div>

      {/* Saved addresses */}
      <div className="card mt-6 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Хадгалсан хаягууд</h2>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="btn-outline !px-4 !py-2 text-xs"
          >
            <Plus className="h-4 w-4" /> Хаяг нэмэх
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddAddress}
            className="mb-6 space-y-4 rounded-2xl bg-smoke/60 p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Нэршил</label>
                <input
                  className="input !bg-white"
                  placeholder="Гэр, ажил..."
                  value={addrForm.label}
                  onChange={(e) =>
                    setAddrForm({ ...addrForm, label: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Хүлээн авагч *</label>
                <input
                  className="input !bg-white"
                  placeholder="Нэр"
                  value={addrForm.fullName}
                  onChange={(e) =>
                    setAddrForm({ ...addrForm, fullName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Утас *</label>
                <input
                  className="input !bg-white"
                  placeholder="9911-2233"
                  value={addrForm.phone}
                  onChange={(e) =>
                    setAddrForm({ ...addrForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Хот</label>
                <select
                  className="input !bg-white"
                  value={addrForm.city}
                  onChange={(e) =>
                    setAddrForm({ ...addrForm, city: e.target.value })
                  }
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Дүүрэг</label>
                <select
                  className="input !bg-white"
                  value={addrForm.district}
                  onChange={(e) =>
                    setAddrForm({ ...addrForm, district: e.target.value })
                  }
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Хороо</label>
                <input
                  className="input !bg-white"
                  placeholder="Хороо"
                  value={addrForm.khoroo}
                  onChange={(e) =>
                    setAddrForm({ ...addrForm, khoroo: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Дэлгэрэнгүй хаяг *</label>
                <input
                  className="input !bg-white"
                  placeholder="Байр, орц, тоот..."
                  value={addrForm.addressDetail}
                  onChange={(e) =>
                    setAddrForm({ ...addrForm, addressDetail: e.target.value })
                  }
                />
              </div>
            </div>
            {addrError && (
              <p className="text-xs font-medium text-red-500">{addrError}</p>
            )}
            <button type="submit" disabled={addrSaving} className="btn-primary">
              {addrSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Хадгалах
            </button>
          </form>
        )}

        {addrLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : addresses.length === 0 ? (
          <p className="rounded-xl bg-smoke/60 p-5 text-sm text-neutral-500">
            Хадгалсан хаяг алга байна.
          </p>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-2xl border p-4",
                  a.is_default ? "border-ink" : "border-ink/10"
                )}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {a.label || "Хаяг"}
                      </p>
                      {a.is_default && (
                        <span className="rounded-full bg-neon px-2 py-0.5 text-[10px] font-bold text-ink">
                          Үндсэн
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {[a.city, a.district, a.khoroo, a.address_detail]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {a.full_name} · {a.phone}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!a.is_default && (
                    <button
                      onClick={() => handleSetDefault(a.id)}
                      title="Үндсэн болгох"
                      className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-smoke hover:text-amber-500"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    title="Устгах"
                    className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
