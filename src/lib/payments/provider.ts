import type { Order } from "@/types";

/**
 * Clean payment provider interface.
 * Real providers (QPay, banks, card gateways) implement this contract —
 * see qpay.ts for the QPay-ready implementation skeleton.
 * No fake "payment succeeded" flows: manual confirmation by admin is the
 * MVP path, and webhooks/callbacks flip payment_status when a real
 * provider is connected.
 */
export interface PaymentIntent {
  provider: string;
  reference: string; // e.g. invoice id / transaction note
  qrImage?: string; // base64 QR (QPay)
  deeplinks?: { name: string; link: string }[];
  instructions: string;
}

export interface PaymentProvider {
  id: "qpay" | "bank_transfer" | "cod" | "online";
  /** Create a payment intent for an order (server-side only). */
  createIntent(order: Order): Promise<PaymentIntent>;
  /** Check payment status against the provider (server-side only). */
  verify(reference: string): Promise<boolean>;
}

export class CashOnDeliveryProvider implements PaymentProvider {
  id = "cod" as const;
  async createIntent(order: Order): Promise<PaymentIntent> {
    return {
      provider: "cod",
      reference: order.order_number,
      instructions: "Хүргэлтийн үед бэлнээр төлнө үү.",
    };
  }
  async verify(): Promise<boolean> {
    return false; // confirmed manually by admin on delivery
  }
}

export class BankTransferProvider implements PaymentProvider {
  id = "bank_transfer" as const;
  async createIntent(order: Order): Promise<PaymentIntent> {
    return {
      provider: "bank_transfer",
      reference: order.order_number,
      instructions: "Гүйлгээний утга дээр захиалгын дугаараа бичнэ үү.",
    };
  }
  async verify(): Promise<boolean> {
    return false; // confirmed manually by admin against the bank statement
  }
}
