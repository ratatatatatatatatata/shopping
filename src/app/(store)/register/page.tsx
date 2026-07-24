"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, phone: form.phone },
      },
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Энэ и-мэйл аль хэдийн бүртгэлтэй байна."
          : "Бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу."
      );
      return;
    }
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setSuccess(true); // email confirmation enabled
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-bold">И-мэйлээ шалгана уу</h1>
          <p className="mt-3 text-sm text-neutral-500">
            Бид таны и-мэйл рүү баталгаажуулах холбоос илгээлээ. Холбоос дээр
            дарж бүртгэлээ идэвхжүүлнэ үү.
          </p>
          <Link href="/login" className="btn-primary mt-6">
            Нэвтрэх хуудас руу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8"
      >
        <h1 className="font-display text-2xl font-bold">Бүртгүүлэх</h1>
        <p className="mt-2 text-sm text-neutral-500">
          ХЭТ-д тавтай морил — шинэ бүртгэл үүсгэнэ үү.
        </p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label className="label">Нэр</label>
            <input
              required
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Таны нэр"
            />
          </div>
          <div>
            <label className="label">Утас</label>
            <input
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="9911-2233"
            />
          </div>
          <div>
            <label className="label">И-мэйл</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="label">Нууц үг</label>
            <input
              type="password"
              required
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Хамгийн багадаа 6 тэмдэгт"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-neon w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Бүртгүүлэх
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-500">
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="font-semibold text-electric hover:underline">
            Нэвтрэх
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
