"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Loader2 } from "lucide-react";
import type { Review } from "@/types";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { reviewSchema } from "@/lib/validation";
import { formatDate, cn } from "@/utils/format";
import { AnimatedSection } from "./AnimatedSection";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-neutral-300"
          )}
        />
      ))}
    </div>
  );
}

export function ReviewSection({
  productId,
  reviews,
}: {
  productId: string;
  reviews: Review[];
}) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const average = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setMessage(null);

    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setMessage({ type: "error", text: "Үнэлгээгээ шалгана уу." });
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").upsert(
      {
        product_id: productId,
        user_id: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
      { onConflict: "product_id,user_id" }
    );
    setSubmitting(false);

    if (error) {
      setMessage({
        type: "error",
        text: "Сэтгэгдэл илгээхэд алдаа гарлаа. Дахин оролдоно уу.",
      });
      return;
    }
    setComment("");
    setMessage({
      type: "success",
      text: "Баярлалаа! Таны сэтгэгдэл баталгаажсаны дараа нийтлэгдэнэ.",
    });
    router.refresh();
  }

  return (
    <AnimatedSection>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Үнэлгээ</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={average} />
            <span className="text-sm font-bold">{average.toFixed(1)}</span>
            <span className="text-xs text-neutral-400">
              ({reviews.length} сэтгэгдэл)
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Review list */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="rounded-2xl bg-smoke/70 p-6 text-sm text-neutral-500">
              Одоогоор сэтгэгдэл алга. Та анхны сэтгэгдлээ үлдээгээрэй!
            </p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-smoke text-sm font-bold">
                      {(r.profiles?.full_name ?? "Х").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {r.profiles?.full_name ?? "Хэрэглэгч"}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {formatDate(r.created_at)}
                      </p>
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {r.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Review form */}
        <div className="card h-fit p-6">
          <h3 className="mb-4 font-display text-lg font-bold">
            Сэтгэгдэл үлдээх
          </h3>
          {!loading && !user ? (
            <div className="rounded-xl bg-smoke/70 p-5 text-sm text-neutral-600">
              Сэтгэгдэл үлдээхийн тулд{" "}
              <Link href="/login" className="font-semibold text-electric hover:underline">
                нэвтэрнэ үү
              </Link>
              .
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="label">Үнэлгээ</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      aria-label={`${n} од`}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "h-7 w-7",
                          n <= (hovered || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-neutral-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Сэтгэгдэл</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  className="input min-h-[110px]"
                  placeholder="Бүтээгдэхүүний талаарх сэтгэгдлээ бичнэ үү..."
                />
              </div>
              {message && (
                <p
                  className={cn(
                    "rounded-xl p-3 text-sm font-medium",
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  )}
                >
                  {message.text}
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submitting || !user}
                className="btn-primary"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Илгээх
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </AnimatedSection>
  );
}
