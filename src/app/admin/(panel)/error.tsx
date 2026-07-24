"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <div>
        <h2 className="font-display text-lg font-bold">Алдаа гарлаа</h2>
        <p className="mt-1 max-w-md text-sm text-neutral-500">
          {error.message || "Сервер талын алдаа. Vercel Logs дээрээс дэлгэрэнгүйг харна уу."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-neutral-400">Digest: {error.digest}</p>
        )}
      </div>
      <button onClick={reset} className="btn-primary">
        <RefreshCw className="h-4 w-4" /> Дахин оролдох
      </button>
    </div>
  );
}
