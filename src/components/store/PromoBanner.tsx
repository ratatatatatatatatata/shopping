"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

export function PromoBanner({
  title,
  subtitle,
  linkUrl,
}: {
  title?: string | null;
  subtitle?: string | null;
  linkUrl?: string | null;
}) {
  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-white sm:p-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-neon/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-grape/30 blur-[80px]" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neon">
            Хязгаарлагдмал хугацаатай
          </p>
          {title ? (
            <h3 className="mt-3 max-w-lg font-display text-3xl font-bold sm:text-4xl">
              {title}
            </h3>
          ) : (
            <h3 className="mt-3 max-w-lg font-display text-3xl font-bold sm:text-4xl">
              Сонгосон загварууд <span className="text-gradient">-30%</span>{" "}
              хүртэл
            </h3>
          )}
          <p className="mt-3 max-w-md text-sm text-white/60">
            {subtitle ||
              "Улирлын хямдрал — streetwear болон premium casual хувцаснууд."}
          </p>
          <Link href={linkUrl || "/sale"} className="btn-neon mt-7">
            Хямдрал үзэх <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
}
