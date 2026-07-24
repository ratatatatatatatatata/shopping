"use client";

import { useState } from "react";
import { Copy, Check, Landmark } from "lucide-react";
import { BANK_INFO } from "@/lib/constants";
import { formatPrice } from "@/utils/format";

export function BankTransferBox({
  amount,
  orderNumber,
}: {
  amount: number;
  orderNumber: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(key: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const rows = [
    { key: "bank", label: "Банк", value: BANK_INFO.bankName },
    { key: "account", label: "Дансны дугаар", value: BANK_INFO.accountNumber },
    { key: "holder", label: "Хүлээн авагч", value: BANK_INFO.accountHolder },
    { key: "amount", label: "Дүн", value: formatPrice(amount) },
    { key: "note", label: "Гүйлгээний утга", value: orderNumber },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2">
        <Landmark className="h-5 w-5" />
        <h3 className="font-display text-lg font-bold">Банкны шилжүүлэг</h3>
      </div>
      <div className="mt-5 space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-center justify-between rounded-xl bg-smoke px-4 py-3"
          >
            <div>
              <p className="text-[11px] uppercase tracking-wide text-neutral-400">
                {r.label}
              </p>
              <p className="text-sm font-semibold">{r.value}</p>
            </div>
            <button
              onClick={() => copy(r.key, r.value)}
              className="rounded-full p-2 transition-colors hover:bg-white"
              aria-label="Хуулах"
            >
              {copied === r.key ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 text-neutral-400" />
              )}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-700">
        Гүйлгээний утга дээр захиалгын дугаараа бичнэ үү.
      </p>
      <p className="mt-3 text-xs text-neutral-400">
        Төлбөрийг шалгасны дараа админ захиалгыг баталгаажуулна.
      </p>
    </div>
  );
}
