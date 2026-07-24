import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "super_admin"].includes(profile.role))
    redirect("/admin/login?error=not_admin");

  return (
    <div className="min-h-screen bg-smoke/50">
      <AdminSidebar />
      <div className="lg:pl-60">
        <AdminTopbar adminName={profile.full_name || "Админ"} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
