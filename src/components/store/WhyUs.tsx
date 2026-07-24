"use client";

import { motion } from "framer-motion";
import { Truck, ShieldCheck, RefreshCcw, Headphones } from "lucide-react";
import { AnimatedSection, StaggerGrid, staggerItem } from "./AnimatedSection";

const ITEMS = [
  { icon: Truck, title: "Шуурхай хүргэлт", desc: "Улаанбаатар хотод 24–48 цагт хүргэнэ." },
  { icon: ShieldCheck, title: "Баталгаат чанар", desc: "Premium материал, чанарын баталгаа." },
  { icon: RefreshCcw, title: "Хялбар солилт", desc: "7 хоногийн дотор размер солих боломж." },
  { icon: Headphones, title: "Тусламж", desc: "Өдөр бүр 10:00–22:00 цагт холбогдоно." },
];

export function WhyUs() {
  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6">
      <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">
        Яагаад биднийг сонгох вэ?
      </h2>
      <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              variants={staggerItem}
              className="card group p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-neon transition-colors group-hover:bg-accent-gradient group-hover:text-ink">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-500">{item.desc}</p>
            </motion.div>
          );
        })}
      </StaggerGrid>
    </AnimatedSection>
  );
}
