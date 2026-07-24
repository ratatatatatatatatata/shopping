"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ERRORS: Record<string, string> = {
  NOT_AUTHORIZED: "Зөвхөн супер админ эрх олгож чадна.",
  INVALID_ROLE: "Буруу эрхийн төрөл.",
  USER_NOT_FOUND:
    "Энэ и-мэйлтэй хэрэглэгч олдсонгүй. Тухайн хүн эхлээд сайтад бүртгүүлсэн байх ёстой.",
  CANNOT_DEMOTE_SELF: "Өөрийнхөө супер админ эрхийг хасах боломжгүй.",
};

export function RoleManager({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isSuperAdmin) {
    return (
      <p className="rounded-xl bg-smoke p-3 text-xs text-neutral-500">
        Эрх олгох/хасах үйлдлийг зөвхөн супер админ хийнэ.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("set_user_role", {
      target_email: email.trim(),
      new_role: role,
    });
    setLoading(false);
    if (error) {
      const key = Object.keys(ERRORS).find((k) => error.message.includes(k));
      setMessage({
        ok: false,
        text: key ? ERRORS[key] : "Алдаа гарлаа: " + error.message,
      });
      return;
    }
    setMessage({
      ok: true,
      text: `${email.trim()} — эрх амжилттай өөрчлөгдлөө (${role}).`,
    });
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="label">Хэрэглэгчийн и-мэйл</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="label">Эрх</label>
          <select
            className="input !w-40 cursor-pointer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="admin">Админ</option>
            <option value="super_admin">Супер админ</option>
            <option value="customer">Энгийн хэрэглэгч (эрх хасах)</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-neon !py-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldPlus className="h-4 w-4" />
          )}
          Хадгалах
        </button>
      </div>
      {message && (
        <p
          className={`rounded-xl p-3 text-sm font-medium ${
            message.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
      <p className="text-xs text-neutral-400">
        Тухайн хүн эхлээд сайтад өөрөө бүртгүүлсэн байх шаардлагатай.
      </p>
    </form>
  );
}
