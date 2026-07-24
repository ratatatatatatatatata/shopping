"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/format";

export function StatsCard({
  title,
  value,
  icon: Icon,
  accent = "neon",
  index = 0,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  accent?: "neon" | "electric" | "grape" | "red";
  index?: number;
}) {
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
