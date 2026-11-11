import { createClient } from "@/lib/supabase/server";
import type { Look, Product } from "@/types";
import { LooksManager } from "@/components/admin/LooksManager";

export const dynamic = "force-dynamic";

export type LookProductOption = Pick<
  Product,
  "id" | "name" | "slug" | "main_image_url" | "status"
>;

export default async function AdminLooksPage() {
  const supabase = await createClient();
  const [looksRes, productsRes] = await Promise.all([
    supabase
      .from("looks")
      .select("*, look_items(*)")
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("products")
      .select("id, name, slug, main_image_url, status")
      .neq("status", "archived")
      .order("name"),
  ]);

  const missingTable =
    !!looksRes.error &&
    /looks|relation|schema cache/i.test(looksRes.error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Сет хувцас</h1>
        <p className="mt-1 text-sm text-neutral-500">
          «Сет хувцас» хуудсанд гарах загвар өмсгөлүүд. Загварын зураг оруулаад,
          түүн дээр бараануудаа цэгээр тэмдэглэнэ.
        </p>
      </div>
      {missingTable ? (
        <div className="card p-6 text-sm text-red-600">
          Өгөгдлийн сангийн хүснэгт олдсонгүй. Supabase SQL Editor дээр{" "}
          <code className="rounded bg-red-50 px-1">
            supabase/migrations/202611110001_rail_looks_drop.sql
          </code>{" "}
          файлыг ажиллуулна уу.
        </div>
      ) : (
        <LooksManager
          looks={(looksRes.data ?? []) as Look[]}
          products={(productsRes.data ?? []) as LookProductOption[]}
        />
      )}
    </div>
  );
}
