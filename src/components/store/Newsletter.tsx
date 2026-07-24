"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  }

  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-smoke p-10 sm:p-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-electric/10 blur-[80px]" />
        <div className="relative mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-neon">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="font-display text-2xl font-bold sm:text-3xl">
            Шинэ загвар, хямдралын мэдээ
          </h3>
          <p className="mt-2 text-sm text-neutral-500">
            И-мэйлээ үлдээгээд шинэ коллекц, онцгой урамшууллын мэдээг хамгийн
            түрүүнд аваарай.
          </p>
          {done ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700"
            >
              <Check className="h-4 w-4" /> Баярлалаа! Та амжилттай бүртгүүллээ.
            </motion.p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tanii@email.mn"
                className="input flex-1 !bg-white"
              />
              <button type="submit" className="btn-primary shrink-0">
                Бүртгүүлэх
              </button>
            </form>
          )}
        </div>
      </div>
    </AnimatedSection>
  );
}
