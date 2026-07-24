import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DeliveryMethod,
  ProductStatus,
  Gender,
} from "@/types";

export const SITE_NAME = "KHET";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const DELIVERY_FEE = 6000;
export const EXPRESS_FEE = 12000;
export const FREE_DELIVERY_OVER = 200000;
export const LOW_STOCK_THRESHOLD = 5;
export const PAGE_SIZE = 12;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  processing: "Бэлтгэж буй",
  shipped: "Хүргэлтэнд гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
  refunded: "Буцаагдсан",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-electric/10 text-electric",
  processing: "bg-grape/10 text-grape",
  shipped: "bg-sky-100 text-sky-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-neutral-200 text-neutral-700",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Төлөгдөөгүй",
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  failed: "Амжилтгүй",
  refunded: "Буцаагдсан",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Бэлнээр (хүргэлтээр)",
  bank_transfer: "Банкны шилжүүлэг",
  qpay: "QPay",
  online: "Онлайн төлбөр",
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  standard: "Энгийн хүргэлт (24–48 цаг)",
  express: "Шуурхай хүргэлт (өдөртөө)",
  pickup: "Дэлгүүрээс авах",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Ноорог",
  published: "Нийтлэгдсэн",
  archived: "Архивлагдсан",
};

export const GENDER_LABELS: Record<Gender, string> = {
  men: "Эрэгтэй",
  women: "Эмэгтэй",
  kids: "Хүүхэд",
  unisex: "Юнисекс",
};

export const DISTRICTS = [
  "Баянзүрх", "Сүхбаатар", "Чингэлтэй", "Хан-Уул",
  "Баянгол", "Сонгинохайрхан", "Налайх", "Багануур", "Орон нутаг",
];

// Fallback bank details (real values come from site_settings.bank)
export const BANK_INFO = {
  bankName: "Хаан Банк",
  accountNumber: "5000-XXXX-XXXX",
  accountHolder: '"ХЭТ ФЭШН" ХХК',
};
