"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Product } from "@/types";

export function HeroSection({
  products,
  title,
  subtitle,
}: {
  products: Product[];
  title?: string | null;
  subtitle?: string | null;
}) {
  const featured = products.slice(0, 3);
  const heading = title || "Шинэ үеийн стиль эндээс эхэлнэ";
  const words = heading.split(" ");
  const headStart = words.slice(0, Math.max(1, words.length - 2)).join(" ");
  const headEnd = words.slice(Math.max(1, words.length - 2)).join(" ");

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      {/* Gradient blobs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-grape/30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-electric/25 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 rounded-full bg-neon/15 blur-[100px]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-neon" />
            Streetwear · Premium Casual · 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-display text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl"
          >
            {headStart} <span className="text-gradient">{headEnd}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-5 max-w-md text-base text-white/60 sm:text-lg"
          >
            {subtitle ||
              "Залуусын өдөр тутмын, streetwear болон premium casual хувцаснууд"}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/shop" className="btn-neon">
              Дэлгүүр үзэх <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/new-arrivals"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-neon hover:text-neon"
            >
              Шинэ загварууд
            </Link>
          </motion.div>
        </div>

        {/* Floating product cards */}
        <div className="relative hidden h-[480px] lg:block">
          {featured.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 60, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: i === 0 ? -6 : i === 1 ? 4 : -2 }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
              className={`absolute w-52 ${
                i === 0
                  ? "left-4 top-8 animate-float"
                  : i === 1
                  ? "right-8 top-24 animate-float-slow"
                  : "bottom-4 left-1/3 animate-float"
              }`}
            >
              <Link href={`/product/${p.slug}`}>
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-transform hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.main_image_url ?? ""}
                    alt={p.name}
                    className="aspect-[3/4] w-full rounded-2xl object-cover"
                  />
                  <div className="px-2 py-3">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-neon">
                      {new Intl.NumberFormat("mn-MN").format(Number(p.base_price))}₮
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Marquee */}
      <div className="relative border-t border-white/10 py-3">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-white/30">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-8">
              <span>Streetwear</span><span className="text-neon">●</span>
              <span>Premium Casual</span><span className="text-electric">●</span>
              <span>Шинэ загвар</span><span className="text-grape">●</span>
              <span>Хүргэлттэй</span><span className="text-neon">●</span>
              <span>Orasuits Дэлгүүр</span><span className="text-electric">●</span>
              <span>Streetwear</span><span className="text-grape">●</span>
              <span>Premium Casual</span><span className="text-neon">●</span>
              <span>Шинэ загвар</span><span className="text-electric">●</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
