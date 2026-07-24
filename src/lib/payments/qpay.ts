/**
 * QPay integration stub.
 *
 * Энэ MVP-д QPay-ийн жинхэнэ API холбогдоогүй — захиалга "Төлбөр хүлээгдэж буй"
 * статустай үүсэж, админ гараар баталгаажуулна.
 *
 * Жинхэнэ холболт хийхдээ (https://developer.qpay.mn):
 * 1. QPay-ээс merchant бүртгэл + username/password/invoice_code авна.
 * 2. Vercel дээр server-side env нэмнэ (NEXT_PUBLIC_ битгий ашигла):
 *      QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE
 * 3. Доорх функцуудыг бөглөж, /api/qpay/callback route handler нэмж
 *    payment_status-г автоматаар шинэчилнэ.
 */

const QPAY_BASE_URL = "https://merchant.qpay.mn/v2";

export interface QPayInvoice {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64 QR
  urls: { name: string; description: string; link: string }[];
}

export async function getQPayToken(): Promise<string> {
  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;
  if (!username || !password) {
    throw new Error("QPay credentials are not configured (QPAY_USERNAME / QPAY_PASSWORD).");
  }
  const res = await fetch(`${QPAY_BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
    },
  });
  if (!res.ok) throw new Error("QPay auth failed");
  const data = await res.json();
  return data.access_token as string;
}

export async function createQPayInvoice(params: {
  orderNumber: string;
  amount: number;
  description: string;
  callbackUrl: string;
}): Promise<QPayInvoice> {
  const token = await getQPayToken();
  const res = await fetch(`${QPAY_BASE_URL}/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: params.orderNumber,
      invoice_receiver_code: "terminal",
      invoice_description: params.description,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  });
  if (!res.ok) throw new Error("QPay invoice creation failed");
  return (await res.json()) as QPayInvoice;
}

export async function checkQPayPayment(invoiceId: string): Promise<boolean> {
  const token = await getQPayToken();
  const res = await fetch(`${QPAY_BASE_URL}/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return (data.paid_amount ?? 0) > 0;
}
