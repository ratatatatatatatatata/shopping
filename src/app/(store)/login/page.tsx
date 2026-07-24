"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError("И-мэйл эсвэл нууц үг буруу байна.");
      return;
    }
    router.push(params.get("redirect") ?? "/");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="card w-full max-w-md p-8"
    >
      <h1 className="font-display text-2xl font-bold">Нэвтрэх</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Тавтай морил! Бүртгэлээрээ нэвтэрнэ үү.
      </p>
      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="label">И-мэйл</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="label">Нууц үг</label>
          <input
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Нэвтрэх
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500">
        Бүртгэлгүй юу?{" "}
        <Link href="/register" className="font-semibold text-electric hover:underline">
          Бүртгүүлэх
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
