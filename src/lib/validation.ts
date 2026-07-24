import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Нэрээ оруулна уу"),
  phone: z.string().min(6, "Утасны дугаараа оруулна уу"),
  email: z.string().email("И-мэйл буруу байна").or(z.literal("")),
  city: z.string().min(1, "Хот сонгоно уу"),
  district: z.string().optional().default(""),
  khoroo: z.string().optional().default(""),
  addressDetail: z.string().min(5, "Дэлгэрэнгүй хаягаа оруулна уу"),
  deliveryNote: z.string().optional().default(""),
  deliveryMethod: z.enum(["standard", "express", "pickup"]),
  paymentMethod: z.enum(["cod", "bank_transfer", "qpay", "online"]),
  couponCode: z.string().optional().default(""),
});
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const productSchema = z.object({
  name: z.string().min(2, "Барааны нэр шаардлагатай"),
  category_id: z.string().min(1, "Ангилал сонгоно уу"),
  brand_id: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  barcode: z.string().optional().default(""),
  gender: z.enum(["men", "women", "kids", "unisex"]),
  short_description: z.string().optional().default(""),
  description: z.string().optional().default(""),
  material: z.string().optional().default(""),
  care_instructions: z.string().optional().default(""),
  base_price: z.coerce.number().min(0, "Үнэ 0-ээс их байх ёстой"),
  sale_price: z.coerce.number().nullable().optional(),
  cost_price: z.coerce.number().nullable().optional(),
  seo_title: z.string().optional().default(""),
  seo_description: z.string().optional().default(""),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(1000).optional().default(""),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Код 3+ тэмдэгт").toUpperCase(),
  discount_type: z.enum(["percentage", "fixed", "free_shipping"]),
  discount_value: z.coerce.number().min(0),
  min_order_amount: z.coerce.number().min(0).default(0),
  usage_limit: z.coerce.number().nullable().optional(),
  is_active: z.boolean().default(true),
});
