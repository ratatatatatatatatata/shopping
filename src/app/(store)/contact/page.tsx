"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { AnimatedSection } from "@/components/store/AnimatedSection";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <AnimatedSection>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Холбоо барих
        </h1>
        <p className="mt-3 text-neutral-500">
          Асуулт байна уу? Бидэнтэй холбогдоорой — бид таньд туслахдаа таатай
          байх болно.
        </p>
      </AnimatedSection>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <AnimatedSection delay={0.1} className="space-y-4">
          {[
            { icon: Phone, title: "Утас", value: "+976 9999-9999" },
            { icon: Mail, title: "И-мэйл", value: "hello@khet.mn" },
            { icon: MapPin, title: "Хаяг", value: "Улаанбаатар, Сүхбаатар дүүрэг" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="card flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-neon">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    {c.title}
                  </p>
                  <p className="font-semibold">{c.value}</p>
                </div>
              </div>
            );
          })}
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-neutral-400">
              Ажиллах цаг
            </p>
            <p className="mt-1 font-semibold">Өдөр бүр 10:00 – 22:00</p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="card space-y-4 p-6"
          >
            <h2 className="font-display text-lg font-bold">Мессеж илгээх</h2>
            <div>
              <label className="label">Нэр</label>
              <input required className="input" placeholder="Таны нэр" />
            </div>
            <div>
              <label className="label">И-мэйл</label>
              <input required type="email" className="input" placeholder="email@example.com" />
            </div>
            <div>
              <label className="label">Мессеж</label>
              <textarea required className="input min-h-[120px]" placeholder="Таны асуулт..." />
            </div>
            {sent ? (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                Мессеж илгээгдлээ. Бид удахгүй хариулах болно!
              </p>
            ) : (
              <button type="submit" className="btn-primary w-full">
                <Send className="h-4 w-4" /> Илгээх
              </button>
            )}
          </form>
        </AnimatedSection>
      </div>
    </div>
  );
}
