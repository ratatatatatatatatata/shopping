"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NotificationDropdown } from "./NotificationDropdown";
import { ADMIN_LINKS } from "./AdminSidebar";
import { cn } from "@/utils/format";

export function AdminTopbar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink/5 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-full p-2 hover:bg-smoke lg:hidden"
          aria-label="Цэс"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-sm font-bold sm:text-base">
          Сайн уу, {adminName} 👋
        </h1>
      </div>
      <NotificationDropdown />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 z-50 h-full w-64 bg-ink p-4 text-white lg:hidden"
            >
              <div className="flex items-center justify-between px-2 py-2">
                <span className="font-display font-bold">
                  ХЭТ<span className="text-neon">.</span> админ
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1 overflow-y-auto">
                {ADMIN_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white",
                        pathname.startsWith(link.href) && "bg-white/10 text-neon"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
