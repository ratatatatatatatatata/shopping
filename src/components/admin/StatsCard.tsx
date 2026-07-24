"use client";

import { motion } from "framer-motion";
import {
  Banknote,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Package,
  AlertTriangle,
  PackageX,
  TrendingUp,
  Layers,
} from "lucide-react";
import { cn } from "@/utils/format";

// Icon is passed as a string key: functions can't cross the
// Server -> Client Component boundary in Next.js.
const ICONS = {
  banknote: Banknote,
  cart: ShoppingCart,
  clock: Clock,
  check: CheckCircle2,
  x: XCircle,
  users: Users,
  package: Package,
  alert: AlertTriangle,
  packageX: PackageX,
  trending: TrendingUp,
  layers: Layers,
} as const;

export type StatsIcon = keyof typeof ICONS;

export function StatsCard({
  title,
  value,
  icon,
  accent = "neon",
  index = 0,
}: {
  title: string;
  value: string;
  icon: StatsIcon;
  accent?: "neon" | "electric" | "grape" | "red";
  index?: number;
}) {
  const Icon = ICONS[icon] ?? Package;
  const accents = {
    neon: "bg-neon/15 text-lime-700",
    electric: "bg-electric/10 text-electric",
    grape: "bg-grape/10 text-grape",
    red: "bg-red-100 text-red-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {title}
        </p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accents[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
    </motion.div>
  );
}
