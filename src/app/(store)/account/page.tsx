"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Package, LogOut, UserCog, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading } = useUser();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold">Нэвтрээгүй байна</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Бүртгэлээ харахын тулд нэвтэрнэ үү.
        </p>
        <Link href="/login?redirect=/account" className="btn-primary mt-6">
          Нэвтрэх
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Миний бүртгэл</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Сайн байна уу,{" "}
        <span className="font-semibold text-ink">
          {profile?.full_name || user.email}
        </span>
        !
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/account/profile"
          className="card flex items-center gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <UserCog className="h-5 w-5 text-grape" />
          <div>
            <p className="font-semibold">Хувийн мэдээлэл</p>
            <p className="text-xs text-neutral-500">
              Профайл болон хадгалсан хаягууд
            </p>
          </div>
        </Link>
        <Link
          href="/account/orders"
          className="card flex items-center gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Package className="h-5 w-5 text-electric" />
          <div>
            <p className="font-semibold">Захиалгын түүх</p>
            <p className="text-xs text-neutral-500">Захиалгуудаа хянах</p>
          </div>
        </Link>
        <Link
          href="/wishlist"
          className="card flex items-center gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Heart className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-semibold">Хадгалсан бараа</p>
            <p className="text-xs text-neutral-500">Дуртай загварууд</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="card flex items-center gap-3 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-semibold">Гарах</p>
            <p className="text-xs text-neutral-500">Бүртгэлээс гарах</p>
          </div>
        </button>
      </div>
    </div>
  );
}
