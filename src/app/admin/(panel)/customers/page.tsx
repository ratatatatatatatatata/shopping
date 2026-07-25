import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import {
  CustomersTable,
  type CustomerOrder,
} from "@/components/admin/CustomersTable";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const [profilesRes, ordersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(
        "id, user_id, order_number, order_status, payment_status, total_amount, created_at"
      )
      .not("user_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const customers = (profilesRes.data ?? []) as Profile[];
  const orders = (ordersRes.data ?? []) as CustomerOrder[];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">
        Хэрэглэгчид ({customers.length})
      </h1>
      <CustomersTable customers={customers} orders={orders} />
    </div>
  );
}
