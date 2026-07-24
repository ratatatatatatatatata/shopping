"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  TicketPercent,
  TrendingUp,
  PanelsTopLeft,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/format";

export const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Хяналтын самбар", icon: LayoutDashboard },
  { href: "/admin/products", label: "Бараа", icon: Package },
  { href: "/admin/categories", label: "Ангилал", icon: FolderTree },
  { href: "/admin/orders", label: "Захиалга", icon: ShoppingCart },
  { href: "/admin/customers", label: "Хэрэглэгчид", icon: Users },
  { href: "/admin/coupons", label: "Купон", icon: TicketPercent },
  { href: "/admin/sales", label: "Борлуулалт", icon: TrendingUp },
  { href: "/admin/content", label: "Агуулга", icon: PanelsTopLeft },
  { href: "/admin/settings", label: "Тохиргоо", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-ink text-white lg:flex">
      <div className="flex h-16 items-center px-6">
        <span className="font-display text-lg font-bold">
          ХЭТ<span className="text-neon">.</span>{" "}
          <span className="text-xs font-normal text-white/40">админ</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ADMIN_LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white",
                active && "bg-white/10 text-neon"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Store className="h-4 w-4" /> Дэлгүүр үзэх
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" /> Гарах
        </button>
      </div>
    </aside>
  );
}
