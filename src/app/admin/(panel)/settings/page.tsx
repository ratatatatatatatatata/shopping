import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/utils/format";

export const dynamic = "force-dynamic";

interface ActivityLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Админ",
  super_admin: "Супер админ",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const [adminsRes, logsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .in("role", ["admin", "super_admin"])
      .order("created_at"),
    supabase
      .from("admin_activity_logs")
      .select("id, admin_id, action, entity, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const admins = adminsRes.data ?? [];
  const logs = (logsRes.data ?? []) as ActivityLog[];
  const emailById = new Map(admins.map((a) => [a.id, a.email ?? "—"]));

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Тохиргоо</h1>

      <div className="card p-6">
        <h2 className="mb-4 font-display text-lg font-bold">
          Админ хэрэглэгчид
        </h2>
        <div className="space-y-2">
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-smoke px-4 py-3 text-sm"
            >
              <span className="font-semibold">{a.full_name || "—"}</span>
              <span className="text-neutral-500">{a.email}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  a.role === "super_admin"
                    ? "bg-grape/10 text-grape"
                    : "bg-electric/10 text-electric"
                }`}
              >
                {ROLE_LABELS[a.role] ?? a.role}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-smoke p-3 text-xs text-neutral-500">
          Шинэ админ нэмэхдээ Supabase SQL Editor дээр:{" "}
          <code>
            update profiles set role = &apos;admin&apos; where email =
            &apos;...&apos;;
          </code>{" "}
          (эсвэл <code>&apos;super_admin&apos;</code>)
        </p>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-display text-lg font-bold">
          Сүүлийн үйлдлүүд
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Бүртгэгдсэн үйлдэл алга байна.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-neutral-400">
                  <th className="px-3 py-2.5">Огноо</th>
                  <th className="px-3 py-2.5">Админ</th>
                  <th className="px-3 py-2.5">Үйлдэл</th>
                  <th className="px-3 py-2.5">Объект</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2.5 text-xs text-neutral-400">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-neutral-600">
                      {log.admin_id
                        ? (emailById.get(log.admin_id) ?? "—")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold">
                      {log.action}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-neutral-500">
                      {log.entity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="mb-3 font-display text-lg font-bold">QPay холболт</h2>
        <p className="text-sm text-neutral-600">
          Одоогоор QPay төлбөр гараар баталгаажиж байна. Жинхэнэ QPay API
          холбохдоо <code>src/lib/payments/qpay.ts</code> файл болон README-ийн
          зааврыг харна уу.
        </p>
      </div>
    </div>
  );
}
