"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/utils/format";

export function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQuantity } = useCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink/5 p-5">
              <h2 className="font-display text-lg font-bold">
                Сагс ({items.length})
              </h2>
              <button onClick={close} className="rounded-full p-2 hover:bg-smoke">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-smoke">
                  <ShoppingBag className="h-7 w-7 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500">Таны сагс хоосон байна</p>
                <Link href="/shop" onClick={close} className="btn-primary">
                  Дэлгүүр үзэх
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.variantId}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="flex gap-3"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-24 w-20 rounded-xl bg-smoke object-cover"
                        />
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${item.slug}`}
                              onClick={close}
                              className="text-sm font-semibold hover:underline"
                            >
                              {item.name}
                            </Link>
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {item.colorName} · {item.size}
                          </p>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-full border border-ink/10 px-2 py-1">
                              <button
                                onClick={() =>
                                  updateQuantity(item.variantId, item.quantity - 1)
                                }
                                className="rounded-full p-0.5 hover:bg-smoke"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.variantId, item.quantity + 1)
                                }
                                className="rounded-full p-0.5 hover:bg-smoke"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-bold">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t border-ink/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Нийт дүн</span>
                    <span className="font-display text-lg font-bold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/cart" onClick={close} className="btn-outline">
                      Сагс үзэх
                    </Link>
                    <Link href="/checkout" onClick={close} className="btn-neon">
                      Захиалах
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
