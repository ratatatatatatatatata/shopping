"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface DailySale {
  date: string;
  amount: number;
  orders: number;
}

export function SalesChart({ data }: { data: DailySale[] }) {
  // Render recharts only in the browser (avoids SSR crashes)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-smoke" />;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B8FF2F" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#2F6BFF" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#999" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#999" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}K`
            }
          />
          <Tooltip
            formatter={(value) => [
              new Intl.NumberFormat("mn-MN").format(Number(value)) + "₮",
              "Борлуулалт",
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #eee",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#2F6BFF"
            strokeWidth={2}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
