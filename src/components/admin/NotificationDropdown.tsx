"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AdminNotification } from "@/types";
import { formatDate } from "@/utils/format";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);
      setNotifications((data ?? []) as AdminNotification[]);
    }
    load();

    // Realtime: шинэ захиалгын мэдэгдэл
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          setNotifications((prev) => [
            payload.new as AdminNotification,
            ...prev,
          ]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2.5 transition-colors hover:bg-smoke"
        aria-label="Мэдэгдэл"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <motion.span
            key={unread}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
          >
            {unread}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
              <span className="text-sm font-bold">Мэдэгдэл</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-electric hover:underline"
                >
                  Бүгдийг уншсан
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-neutral-400">
                  Мэдэгдэл алга
                </p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.order_id ? `/admin/orders/${n.order_id}` : "/admin/orders"}
                    onClick={() => setOpen(false)}
                    className={`block border-b border-ink/5 px-4 py-3 text-sm transition-colors hover:bg-smoke ${
                      !n.is_read ? "bg-electric/5" : ""
                    }`}
                  >
                    <p className="font-semibold">{n.title}</p>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-neutral-500">{n.message}</p>
                    )}
                    <p className="mt-1 text-[10px] text-neutral-400">
                      {formatDate(n.created_at)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
