"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DELIVERY_FEE,
  EXPRESS_FEE,
  FREE_DELIVERY_OVER,
} from "@/lib/constants";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validation";
import type { CartItem, Coupon } from "@/types";

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

export interface CouponResult {
  valid: boolean;
  discount: number;
  freeShipping: boolean;
  error?: string;
}

function computeCouponDiscount(
  coupon: Coupon,
  subtotal: number
): CouponResult {
  const now = Date.now();
  if (!coupon.is_active)
    return { valid: false, discount: 0, freeShipping: false, error: "Купон идэвхгүй байна." };
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now)
    return { valid: false, discount: 0, freeShipping: false, error: "Купон хараахан эхлээгүй байна." };
  if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now)
    return { valid: false, discount: 0, freeShipping: false, error: "Купоны хугацаа дууссан байна." };
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit)
    return { valid: false, discount: 0, freeShipping: false, error: "Купоны ашиглалтын эрх дууссан." };
  if (subtotal < Number(coupon.min_order_amount))
    return {
      valid: false, discount: 0, freeShipping: false,
      error: `Хамгийн багадаа ${Number(coupon.min_order_amount).toLocaleString("mn-MN")}₮-ийн захиалгад хүчинтэй.`,
    };
  if (coupon.discount_type === "percentage")
    return { valid: true, discount: Math.round((subtotal * Number(coupon.discount_value)) / 100), freeShipping: false };
  if (coupon.discount_type === "fixed")
    return { valid: true, discount: Math.min(Number(coupon.discount_value), subtotal), freeShipping: false };
  return { valid: true, discount: 0, freeShipping: true };
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  if (!code.trim())
    return { valid: false, discount: 0, freeShipping: false, error: "Купон код оруулна уу." };
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (!data)
    return { valid: false, discount: 0, freeShipping: false, error: "Купон код олдсонгүй." };
  return computeCouponDiscount(data as Coupon, subtotal);
}

export async function createOrder(
  form: CheckoutFormValues,
  items: CartItem[]
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(form);
  if (!parsed.success)
    return { success: false, error: parsed.error.errors[0]?.message ?? "Форм буруу байна." };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Нэвтэрсэн байх шаардлагатай." };
  if (!items.length) return { success: false, error: "Сагс хоосон байна." };

  // Re-validate variants, stock, and prices from the database
  const variantIds = items.map((i) => i.variantId);
  const { data: variants, error: vErr } = await supabase
    .from("product_variants")
    .select(
      "id, stock_quantity, price, sale_price, size, product_id, color_id, status, products(name, base_price, sale_price, sale_start_at, sale_end_at, status), product_colors(color_name)"
    )
    .in("id", variantIds);
  if (vErr || !variants)
    return { success: false, error: "Барааны мэдээлэл шалгахад алдаа гарлаа." };

  let subtotal = 0;
  const rows: {
    variant_id: string; product_id: string; product_name: string;
    color_name: string; size: string; quantity: number;
    unit_price: number; total_price: number;
  }[] = [];

  for (const item of items) {
    const v = variants.find((x) => x.id === item.variantId);
    if (!v || v.status !== "active")
      return { success: false, error: "Бараа олдсонгүй эсвэл идэвхгүй байна." };
    const product = v.products as unknown as {
      name: string; base_price: number; sale_price: number | null;
      sale_start_at: string | null; sale_end_at: string | null; status: string;
    };
    if (product.status !== "published")
      return { success: false, error: `"${product.name}" нийтлэгдээгүй байна.` };
    if (v.stock_quantity < item.quantity)
      return { success: false, error: `"${product.name}" (${v.size}) барааны үлдэгдэл хүрэлцэхгүй байна.` };

    let unitPrice: number;
    if (v.sale_price != null) unitPrice = Number(v.sale_price);
    else if (v.price != null) unitPrice = Number(v.price);
    else {
      const now = Date.now();
      const saleActive =
        product.sale_price != null &&
        (!product.sale_start_at || new Date(product.sale_start_at).getTime() <= now) &&
        (!product.sale_end_at || new Date(product.sale_end_at).getTime() >= now);
      unitPrice = saleActive ? Number(product.sale_price) : Number(product.base_price);
    }
    subtotal += unitPrice * item.quantity;
    rows.push({
      variant_id: v.id,
      product_id: v.product_id,
      product_name: product.name,
      color_name: (v.product_colors as unknown as { color_name: string }).color_name,
      size: v.size,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: unitPrice * item.quantity,
    });
  }

  // Coupon
  let discount = 0;
  let freeShipping = false;
  let couponRow: Coupon | null = null;
  if (input.couponCode?.trim()) {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", input.couponCode.trim().toUpperCase())
      .maybeSingle();
    if (!data) return { success: false, error: "Купон код олдсонгүй." };
    const res = computeCouponDiscount(data as Coupon, subtotal);
    if (!res.valid) return { success: false, error: res.error };
    discount = res.discount;
    freeShipping = res.freeShipping;
    couponRow = data as Coupon;
  }

  // Delivery fee
  let deliveryFee =
    input.deliveryMethod === "pickup" ? 0
    : input.deliveryMethod === "express" ? EXPRESS_FEE
    : DELIVERY_FEE;
  if (freeShipping || subtotal >= FREE_DELIVERY_OVER) deliveryFee = 0;

  const total = Math.max(0, subtotal - discount) + deliveryFee;

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email || user.email,
      city: input.city,
      district: input.district,
      khoroo: input.khoroo,
      address_detail: input.addressDetail,
      delivery_note: input.deliveryNote,
      delivery_method: input.deliveryMethod,
      payment_method: input.paymentMethod,
      payment_status: "unpaid",
      order_status: "pending",
      subtotal,
      discount_amount: discount,
      delivery_fee: deliveryFee,
      total_amount: total,
      coupon_code: couponRow?.code ?? null,
    })
    .select("id, order_number")
    .single();
  if (oErr || !order)
    return { success: false, error: "Захиалга үүсгэхэд алдаа гарлаа." };

  const { error: iErr } = await supabase
    .from("order_items")
    .insert(rows.map((r) => ({ ...r, order_id: order.id })));
  if (iErr)
    return { success: false, error: "Захиалгын мөр хадгалахад алдаа гарлаа." };

  await supabase.from("payments").insert({
    order_id: order.id,
    payment_method: input.paymentMethod,
    amount: total,
    status: "pending",
    transaction_note: order.order_number,
  });

  // Reserve stock via security-definer RPC (logs inventory transactions)
  for (const r of rows) {
    const { error: sErr } = await supabase.rpc("adjust_stock", {
      p_variant_id: r.variant_id,
      p_change: -r.quantity,
      p_type: "order_reserved",
      p_order_id: order.id,
      p_note: order.order_number,
    });
    if (sErr)
      return { success: false, error: "Үлдэгдэл хүрэлцэхгүй байна. Сагсаа шинэчилнэ үү." };
  }

  // Coupon usage bookkeeping
  if (couponRow) {
    await supabase.from("coupon_usage").insert({
      coupon_id: couponRow.id,
      user_id: user.id,
      order_id: order.id,
    });
    await supabase
      .from("coupons")
      .update({ used_count: couponRow.used_count + 1 })
      .eq("id", couponRow.id);
  }

  revalidatePath("/shop");
  return { success: true, orderId: order.id, orderNumber: order.order_number };
}
