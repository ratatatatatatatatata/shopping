"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  ShoppingBag,
  User,
  X,
  LogOut,
  Package,
  ChevronDown,
  Search,
  Heart,
  UserCog,
} from "lucide-react";
import type { Category } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useWishlist, pullWishlistFromServer } from "@/hooks/useWishlist";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/format";

const LINKS = [
  { href: "/", label: "Нүүр" },
  { href: "/shop", label: "Дэлгүүр" },
  { href: "/new-arrivals", label: "Шинэ загварууд" },
  { href: "/sale", label: "Хямдрал" },
  { href: "/contact", label: "Холбоо барих" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { user, profile } = useUser();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlist((s) => s.productIds.length);
  const openCart = useCart((s) => s.open);

  // Categories for the "Ангилал" dropdown
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order")
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  // Merge server wishlist into local store once logged in
  useEffect(() => {
    if (user) pullWishlistFromServer();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="font-display text-xl font-bold tracking-tight">
            ХЭТ<span className="text-gradient">.</span>
          </span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-smoke",
                pathname === link.href && "bg-smoke font-semibold"
              )}
            >
              {link.label}
            </Link>
          ))}
          {/* Categories dropdown */}
          {categories.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                onClick={() => setCatOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-smoke",
                  pathname.startsWith("/category") && "bg-smoke font-semibold"
                )}
              >
                Ангилал
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    catOpen && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full w-56 overflow-hidden rounded-2xl border border-ink/5 bg-white p-1.5 shadow-xl"
                  >
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/category/${c.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="block rounded-xl px-3 py-2.5 text-sm hover:bg-smoke"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/search"
            className="rounded-full p-2.5 transition-colors hover:bg-smoke"
            aria-label="Хайх"
          >
            <Search className="h-5 w-5" />
          </Link>

          <Link
            href="/wishlist"
            className="relative rounded-full p-2.5 transition-colors hover:bg-smoke"
            aria-label="Хадгалсан бараа"
          >
            <Heart className="h-5 w-5" />
            {wishCount > 0 && (
              <motion.span
                key={wishCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
              >
                {wishCount}
              </motion.span>
            )}
          </Link>

          <button
            onClick={openCart}
            className="relative rounded-full p-2.5 transition-colors hover:bg-smoke"
            aria-label="Сагс"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-neon text-[10px] font-bold text-ink"
              >
                {count}
              </motion.span>
            )}
          </button>

          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full bg-smoke px-3.5 py-2 text-sm font-medium transition-colors hover:bg-neutral-200"
              >
                <User className="h-4 w-4" />
                <span className="max-w-[120px] truncate">
                  {profile?.full_name || "Профайл"}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-ink/5 bg-white p-1.5 shadow-xl"
                  >
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-smoke"
                    >
                      <User className="h-4 w-4" /> Миний бүртгэл
                    </Link>
                    <Link
                      href="/account/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-smoke"
                    >
                      <UserCog className="h-4 w-4" /> Хувийн мэдээлэл
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-smoke"
                    >
                      <Package className="h-4 w-4" /> Захиалгууд
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-smoke"
                    >
                      <Heart className="h-4 w-4" /> Хадгалсан бараа
                    </Link>
                    {(profile?.role === "admin" ||
                      profile?.role === "super_admin") && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-smoke"
                      >
                        <Package className="h-4 w-4" /> Админ
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Гарах
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="hidden md:block">
              <span className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800">
                Нэвтрэх
              </span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2.5 hover:bg-smoke md:hidden"
            aria-label="Цэс"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-white p-6 md:hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold">ХЭТ.</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 hover:bg-smoke"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-8 flex flex-col gap-1">
                {[
                  ...LINKS,
                  { href: "/search", label: "Хайх" },
                  { href: "/wishlist", label: "Хадгалсан" },
                ].map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block rounded-xl px-4 py-3 text-base font-medium hover:bg-smoke",
                        pathname === link.href && "bg-smoke font-semibold"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {categories.length > 0 && (
                  <div className="mt-3 border-t border-ink/5 pt-3">
                    <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Ангилал
                    </p>
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/category/${c.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-xl px-4 py-2.5 text-sm hover:bg-smoke"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-auto space-y-2 pt-6">
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="btn-outline w-full"
                    >
                      Миний бүртгэл
                    </Link>
                    <button onClick={handleLogout} className="btn-primary w-full">
                      Гарах
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary w-full"
                    >
                      Нэвтрэх
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="btn-outline w-full"
                    >
                      Бүртгүүлэх
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
