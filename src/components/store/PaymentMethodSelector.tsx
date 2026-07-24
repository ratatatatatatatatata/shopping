"use client";

import { motion } from "framer-motion";
import { QrCode, Landmark, Banknote } from "lucide-react";
import type { PaymentMethod } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn } from "@/utils/format";

const METHODS: { value: PaymentMethod; desc: string; icon: typeof QrCode }[] = [
  { value: "qpay", desc: "QR код уншуулж төлөх", icon: QrCode },
  { value: "bank_transfer", desc: "Банкны апп-аар шилжүүлэх", icon: Landmark },
  { value: "cod", desc: "Хүргэлтийн үед бэлнээр төлөх", icon: Banknote },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
}: {
  selected: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {METHODS.map((m) => {
        const Icon = m.icon;
        const active = selected === m.value;
        return (
          <motion.button
            key={m.value}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(m.value)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
              active
                ? "border-ink bg-ink text-white"
                : "border-ink/10 hover:border-ink/40"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-neon" : "text-ink")} />
            <span className="text-sm font-semibold">
              {PAYMENT_METHOD_LABELS[m.value]}
            </span>
            <span
              className={cn(
                "text-xs",
                active ? "text-white/60" : "text-neutral-500"
              )}
            >
              {m.desc}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
