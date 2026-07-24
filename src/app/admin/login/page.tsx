"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "not_admin"
      ? "Танд админ эрх байхгүй байна."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      setLoading(false);
      setError("И-мэйл эсвэл нууц үг буруу байна.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);
    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      await supabase.auth.signOut();
      setError("Танд админ эрх байхгүй байна.");
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neon text-ink">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            Админ нэвтрэлт
          </h1>
          <p className="text-xs text-white/50">ХЭТ удирдлагын самбар</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label !text-white/50">И-мэйл</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon/60"
            placeholder="admin@khet.mn"
          />
        </div>
        <div>
          <label className="label !text-white/50">Нууц үг</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon/60"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-400">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-neon w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Нэвтрэх
        </button>
      </form>
    </motion.div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-grape/30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-electric/25 blur-[120px]" />
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
