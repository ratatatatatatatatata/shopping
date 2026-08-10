"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Tag, Check, Truck, Zap, Store } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { createOrder, validateCoupon } from "@/lib/actions/orders";
import {
  DISTRICTS,
  DELIVERY_FEE,
  EXPRESS_FEE,
  FREE_DELIVERY_OVER,
  DELIVERY_METHOD_LABELS,
} from "@/lib/constants";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validation";
import type { DeliveryMethod } from "@/types";
import { formatPrice, cn } from "@/utils/format";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

const CITIES = ["Улаанбаатар", "Орон нутаг"];

const DELIVERY_OPTIONS: {
  value: DeliveryMethod;
  fee: number;
  icon: typeof Truck;
}[] = [
  { value: "standard", fee: DELIVERY_FEE, icon: Truck },
  { value: "express", fee: EXPRESS_FEE, icon: Zap },
  { value: "pickup", fee: 0, icon: Store },
];

interface CouponState {
  status: "idle" | "checking" | "valid" | "invalid";
  discount: number;
  freeShipping: boolean;
  message?: string;
}

export function CheckoutForm({
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [serverError, setServerError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<CouponState>({
    status: "idle",
    discount: 0,
    freeShipping: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: defaultName ?? "",
      phone: defaultPhone ?? "",
      email: defaultEmail ?? "",
      city: "Улаанбаатар",
      district: DISTRICTS[0],
      khoroo: "",
      addressDetail: "",
      deliveryNote: "",
      deliveryMethod: "standard",
      paymentMethod: "qpay",
      couponCode: "",
    },
  });

  const city = watch("city");
  const deliveryMethod = watch("deliveryMethod");
  const paymentMethod = watch("paymentMethod");
  const couponCode = watch("couponCode");

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = coupon.status === "valid" ? coupon.discount : 0;
  const freeDelivery =
    subtotal >= FREE_DELIVERY_OVER ||
    (coupon.status === "valid" && coupon.freeShipping);
  const baseFee =
    deliveryMethod === "pickup"
      ? 0
      : deliveryMethod === "express"
        ? EXPRESS_FEE
        : DELIVERY_FEE;
  const deliveryFee = freeDelivery ? 0 : baseFee;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  async function handleCheckCoupon() {
    const code = (couponCode ?? "").trim();
    if (!code) return;
    setCoupon({ status: "checking", discount: 0, freeShipping: false });
    const res = await validateCoupon(code, subtotal);
    if (res.valid) {
      setCoupon({
        status: "valid",
        discount: res.discount,
        freeShipping: res.freeShipping,
        message: res.freeShipping
          ? "Купон идэвхжлээ — хүргэлт үнэгүй!"
          : `Купон идэвхжлээ — ${formatPrice(res.discount)} хөнгөлөлт.`,
      });
    } else {
      setCoupon({
        status: "invalid",
        discount: 0,
        freeShipping: false,
        message: res.error ?? "Купон код буруу байна.",
      });
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createOrder(
      {
        ...values,
        couponCode: coupon.status === "valid" ? values.couponCode : "",
      },
      items
    );
    if (!result.success) {
      setServerError(result.error ?? "Алдаа гарлаа. Дахин оролдоно уу.");
      return;
    }
    clear();
    router.push(`/checkout/payment/${result.orderId}`);
  });

  if (!items.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-neutral-500">Таны сагс хоосон байна.</p>
        <button onClick={() => router.push("/shop")} className="btn-primary mt-5">
          Дэлгүүр үзэх
        </button>
      </div>
    );
  }

  function fieldError(msg?: string) {
    return msg ? (
      <p className="mt-1 text-xs font-medium text-red-500">{msg}</p>
    ) : null;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-5">
      {/* Customer info */}
      <div className="space-y-5 lg:col-span-3">
        <div className="card p-6">
          <h2 className="mb-5 font-display text-lg font-bold">
            Хүргэлтийн мэдээлэл
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Нэр *</label>
              <input
                className="input"
                placeholder="Таны нэр"
                {...register("customerName")}
              />
              {fieldError(errors.customerName?.message)}
            </div>
            <div>
              <label className="label">Утас *</label>
              <input
                type="tel"
                className="input"
                placeholder="9911-2233"
                {...register("phone")}
              />
              {fieldError(errors.phone?.message)}
            </div>
            <div className="sm:col-span-2">
              <label className="label">И-мэйл</label>
              <input
                type="email"
                className="input"
                placeholder="email@example.com"
                {...register("email")}
              />
              {fieldError(errors.email?.message)}
            </div>
            <div>
              <label className="label">Хот *</label>
              <select className="input" {...register("city")}>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {fieldError(errors.city?.message)}
            </div>
            {city === "Улаанбаатар" ? (
              <div>
                <label className="label">Дүүрэг *</label>
                <select className="input" {...register("district")}>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {fieldError(errors.district?.message)}
              </div>
            ) : (
              <div>
                <label className="label">Аймаг / сум</label>
                <input
                  className="input"
                  placeholder="Аймаг, сум"
                  {...register("district")}
                />
              </div>
            )}
            <div>
              <label className="label">Хороо</label>
              <input
                className="input"
                placeholder="Хороо"
                {...register("khoroo")}
              />
            </div>
            <div>
              <label className="label">Дэлгэрэнгүй хаяг *</label>
              <input
                className="input"
                placeholder="Байр, орц, тоот..."
                {...register("addressDetail")}
              />
              {fieldError(errors.addressDetail?.message)}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Хүргэлтийн тэмдэглэл</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Нэмэлт мэдээлэл..."
                {...register("deliveryNote")}
              />
            </div>
          </div>
        </div>

        {/* Delivery method */}
        <div className="card p-6">
          <h2 className="mb-2 font-display text-lg font-bold">
            Хүргэлтийн хэлбэр
          </h2>
          <p className="mb-4 text-xs text-neutral-400">
            {formatPrice(FREE_DELIVERY_OVER)}-с дээш захиалгад хүргэлт үнэгүй.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {DELIVERY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = deliveryMethod === opt.value;
              const feeLabel =
                opt.value === "pickup"
                  ? "Үнэгүй"
                  : freeDelivery
                    ? "Үнэгүй"
                    : formatPrice(opt.fee);
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    setValue("deliveryMethod", opt.value, {
                      shouldValidate: true,
                    })
                  }
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-ink/10 hover:border-ink/40"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", active ? "text-neon" : "text-ink")}
                  />
                  <span className="text-sm font-semibold">
                    {DELIVERY_METHOD_LABELS[opt.value]}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      active ? "text-neon" : "text-neutral-500"
                    )}
                  >
                    {feeLabel}
                  </span>
                </motion.button>
              );
            })}
          </div>
          {fieldError(errors.deliveryMethod?.message)}
        </div>

        {/* Payment method */}
        <div className="card p-6">
          <h2 className="mb-5 font-display text-lg font-bold">
            Төлбөрийн хэлбэр
          </h2>
          <PaymentMethodSelector
            selected={paymentMethod}
            onSelect={(m) =>
              setValue("paymentMethod", m, { shouldValidate: true })
            }
          />
          {fieldError(errors.paymentMethod?.message)}
        </div>
      </div>

      {/* Order summary */}
      <div className="lg:col-span-2">
        <div className="card p-6 lg:sticky lg:top-24">
          <h2 className="mb-5 font-display text-lg font-bold">
            Захиалгын мэдээлэл
          </h2>
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-16 w-14 rounded-lg bg-smoke object-cover"
                />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-neutral-500">
                    {item.colorName} · {item.size} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-5 border-t border-ink/5 pt-4">
            <label className="label">Купон код</label>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[9rem] flex-1">
                <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  className="input !pl-10 uppercase"
                  placeholder="ORA10"
                  {...register("couponCode", {
                    onChange: () =>
                      setCoupon({
                        status: "idle",
                        discount: 0,
                        freeShipping: false,
                      }),
                  })}
                />
              </div>
              <button
                type="button"
                onClick={handleCheckCoupon}
                disabled={coupon.status === "checking" || !(couponCode ?? "").trim()}
                className="btn-outline shrink-0 !px-5 !py-2.5 text-xs disabled:opacity-50"
              >
                {coupon.status === "checking" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : coupon.status === "valid" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : null}
                Шалгах
              </button>
            </div>
            {coupon.message && (
              <p
                className={cn(
                  "mt-2 text-xs font-medium",
                  coupon.status === "valid"
                    ? "text-emerald-600"
                    : "text-red-500"
                )}
              >
                {coupon.message}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-ink/5 pt-4 text-sm">
            <div className="flex justify-between text-neutral-500">
              <span>Барааны дүн</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-medium text-emerald-600">
                <span>Хөнгөлөлт</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-500">
              <span>Хүргэлт</span>
              <span>{deliveryFee === 0 ? "Үнэгүй" : formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between pt-2 font-display text-lg font-bold">
              <span>Нийт</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {serverError && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              {serverError}
            </p>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSubmitting}
            className="btn-neon mt-5 w-full"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Захиалга баталгаажуулах
          </motion.button>
        </div>
      </div>
    </form>
  );
}
