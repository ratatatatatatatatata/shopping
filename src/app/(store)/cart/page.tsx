"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/utils/format";
import { EmptyState } from "@/components/store/EmptyState";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Сагс</h1>

      {items.length === 0 ? (
        <EmptyState
          title="Таны сагс хоосон байна"
          description="Дэлгүүрээс дуртай загвараа сонгоорой."
          actionLabel="Дэлгүүр үзэх"
          actionHref="/shop"
        />
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.variantId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: 60 }}
                  className="card flex gap-4 p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-28 w-24 rounded-xl bg-smoke object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-semibold hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-ink/10"
                            style={{ backgroundColor: item.colorCode }}
                          />
                          {item.colorName} · Размер: {item.size}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          Нэгж үнэ: {formatPrice(item.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="rounded-full p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                        aria-label="Устгах"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 rounded-full border border-ink/10 px-2.5 py-1.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="rounded-full p-1 hover:bg-smoke"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="rounded-full p-1 hover:bg-smoke"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-display font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold hover:text-electric"
            >
              <ArrowLeft className="h-4 w-4" /> Худалдан авалтаа үргэлжлүүлэх
            </Link>
          </div>

          <div>
            <div className="card p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold">Нийт дүн</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>Барааны дүн</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Хүргэлт</span>
                  <span>Захиалга дээр тооцно</span>
                </div>
                <div className="flex justify-between border-t border-ink/5 pt-3 font-display text-lg font-bold">
                  <span>Нийт</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
              <Link href="/checkout" className="btn-neon mt-5 w-full">
                Захиалга хийх <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
