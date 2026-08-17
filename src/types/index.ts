export type Role = "customer" | "admin" | "super_admin";
export type Gender = "men" | "women" | "kids" | "unisex";
export type ProductStatus = "draft" | "published" | "archived";
export type PaymentMethod = "cod" | "bank_transfer" | "qpay" | "online";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "pending" | "confirmed" | "processing" | "shipped"
  | "delivered" | "cancelled" | "refunded";
export type DeliveryMethod = "standard" | "express" | "pickup";
export type DiscountType = "percentage" | "fixed" | "free_shipping";
export type InventoryTxType =
  | "initial_stock" | "manual_adjustment" | "order_reserved"
  | "order_completed" | "order_cancelled" | "return" | "damaged";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  is_disabled: boolean;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  image_position: string | null;
  image_fit: string | null;
  parent_id: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  brand_id: string | null;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  gender: Gender;
  short_description: string | null;
  description: string | null;
  material: string | null;
  care_instructions: string | null;
  base_price: number;
  sale_price: number | null;
  cost_price: number | null;
  sale_start_at: string | null;
  sale_end_at: string | null;
  main_image_url: string | null;
  image_position: string | null;
  model_url: string | null;
  status: ProductStatus;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
  brands?: Brand | null;
  product_colors?: ProductColor[];
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
  reviews?: Review[];
}

export interface ProductColor {
  id: string;
  product_id: string;
  color_name: string;
  color_code: string;
  image_url: string | null;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color_id: string;
  size: string;
  stock_quantity: number;
  reserved_quantity: number;
  sku: string | null;
  price: number | null;
  sale_price: number | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  color_id: string | null;
  url: string;
  alt: string | null;
  sort_order: number;
  is_cover: boolean;
  object_position: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  product_id: string | null;
  category_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  used_count: number;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  city: string;
  district: string | null;
  khoroo: string | null;
  address_detail: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  district: string | null;
  khoroo: string | null;
  address_detail: string;
  delivery_note: string | null;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  coupon_code: string | null;
  tracking_number: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  color_name: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export interface HomepageSection {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  content: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
  updated_at: string;
}

export interface SiteSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  order_id: string | null;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  variant_id: string;
  type: InventoryTxType;
  quantity_change: number;
  note: string | null;
  order_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  colorId: string;
  name: string;
  slug: string;
  colorName: string;
  colorCode: string;
  size: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
}

/** Effective selling price of a product (sale window respected). */
export function effectivePrice(p: {
  base_price: number;
  sale_price?: number | null;
  sale_start_at?: string | null;
  sale_end_at?: string | null;
}): number {
  if (p.sale_price == null) return Number(p.base_price);
  const now = Date.now();
  if (p.sale_start_at && new Date(p.sale_start_at).getTime() > now)
    return Number(p.base_price);
  if (p.sale_end_at && new Date(p.sale_end_at).getTime() < now)
    return Number(p.base_price);
  return Number(p.sale_price);
}

export function variantPrice(v: ProductVariant, p: Product): number {
  if (v.sale_price != null) return Number(v.sale_price);
  if (v.price != null) return Number(v.price);
  return effectivePrice(p);
}
