"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, PackageCheck, Percent } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Category, Brand, Gender } from "@/types";
import { GENDER_LABELS } from "@/lib/constants";
import { cn } from "@/utils/format";

const COLORS = [
  { name: "Хар", code: "#111111" },
  { name: "Цагаан", code: "#FFFFFF" },
  { name: "Саарал", code: "#9CA3AF" },
  { name: "Цэнхэр", code: "#2F6BFF" },
  { name: "Ягаан", code: "#8B5CF6" },
  { name: "Неон ногоон", code: "#B8FF2F" },
  { name: "Хаки", code: "#6B6B47" },
];
const SORTS = [
  { value: "newest", label: "Шинэ эхэндээ" },
  { value: "price_asc", label: "Үнэ: багаас их" },
  { value: "price_desc", label: "Үнэ: ихээс бага" },
  { value: "popularity", label: "Эрэлттэй" },
  { value: "discount", label: "Хямдрал ихтэй" },
];

export function SearchFilter({
  categories,
  brands = [],
  sizes,
}: {
  categories: Category[];
  brands?: Brand[];
  sizes: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState(params.get("q") ?? "");

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || next.get(key) === value) next.delete(key);
      else next.set(key, value);
      next.delete("page"); // filters changed -> back to page 1
      startTransition(() =>
        router.push(`/shop?${next.toString()}`, { scroll: false })
      );
    },
    [params, router]
  );

  const filters = (
    <div className="space-y-7">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", search || null);
        }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Хайх..."
          className="input pl-11"
        />
      </form>

      {/* Categories */}
      <div>
        <h4 className="label">Ангилал</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam("category", c.slug)}
              className={cn(
                "rounded-full border border-ink/10 px-3.5 py-1.5 text-xs font-medium transition-all hover:border-ink",
                params.get("category") === c.slug && "border-ink bg-ink text-white"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h4 className="label">Брэнд</h4>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => setParam("brand", b.slug)}
                className={cn(
                  "rounded-full border border-ink/10 px-3.5 py-1.5 text-xs font-medium transition-all hover:border-ink",
                  params.get("brand") === b.slug && "border-ink bg-ink text-white"
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gender */}
      <div>
        <h4 className="label">Хэнд зориулсан</h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
            <button
              key={g}
              onClick={() => setParam("gender", g)}
              className={cn(
                "rounded-full border border-ink/10 px-3.5 py-1.5 text-xs font-medium transition-all hover:border-ink",
                params.get("gender") === g && "border-ink bg-ink text-white"
              )}
            >
              {GENDER_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h4 className="label">Размер</h4>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setParam("size", s)}
              className={cn(
                "min-w-[42px] rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-medium transition-all hover:border-ink",
                params.get("size") === s && "border-ink bg-ink text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="label">Өнгө</h4>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() => setParam("color", c.name)}
              className={cn(
                "h-8 w-8 rounded-full border-2 border-ink/10 transition-all hover:scale-110",
                params.get("color") === c.name && "ring-2 ring-ink ring-offset-2"
              )}
              style={{ backgroundColor: c.code }}
            />
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="label">Үнэ</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "< 50K", min: "0", max: "50000" },
            { label: "50K–100K", min: "50000", max: "100000" },
            { label: "100K–150K", min: "100000", max: "150000" },
            { label: "150K+", min: "150000", max: "" },
          ].map((r) => {
            const active =
              params.get("min") === r.min && (params.get("max") ?? "") === r.max;
            return (
              <button
                key={r.label}
                onClick={() => {
                  const next = new URLSearchParams(params.toString());
                  if (active) {
                    next.delete("min");
                    next.delete("max");
                  } else {
                    next.set("min", r.min);
                    if (r.max) next.set("max", r.max);
                    else next.delete("max");
                  }
                  next.delete("page");
                  router.push(`/shop?${next.toString()}`, { scroll: false });
                }}
                className={cn(
                  "rounded-full border border-ink/10 px-3.5 py-1.5 text-xs font-medium transition-all hover:border-ink",
                  active && "border-ink bg-ink text-white"
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability & discount toggles */}
      <div className="space-y-2">
        <button
          onClick={() => setParam("instock", params.get("instock") ? null : "1")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl border border-ink/10 px-4 py-2.5 text-xs font-medium transition-all hover:border-ink",
            params.get("instock") && "border-ink bg-ink text-white"
          )}
        >
          <PackageCheck className="h-4 w-4" /> Зөвхөн нөөцтэй бараа
        </button>
        <button
          onClick={() => setParam("sale", params.get("sale") ? null : "1")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl border border-ink/10 px-4 py-2.5 text-xs font-medium transition-all hover:border-ink",
            params.get("sale") && "border-ink bg-ink text-white"
          )}
        >
          <Percent className="h-4 w-4" /> Зөвхөн хямдралтай
        </button>
      </div>

      {/* Clear */}
      {params.toString() && (
        <button
          onClick={() => router.push("/shop")}
          className="text-xs font-semibold text-red-500 underline-offset-2 hover:underline"
        >
          Шүүлтүүр арилгах
        </button>
      )}
    </div>
  );

  return (
    // Single root element: the parent grid expects exactly one child here
    <div>
      {/* Sort + mobile filter toggle */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="btn-outline !px-4 !py-2 text-xs lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Шүүлтүүр
        </button>
        <select
          value={params.get("sort") ?? "newest"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="input cursor-pointer !py-2 text-xs lg:!w-full"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">{filters}</aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-6 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display font-bold">Шүүлтүүр</h3>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 hover:bg-smoke"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filters}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
