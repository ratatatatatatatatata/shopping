import { createClient } from "@/lib/supabase/server";
import { effectivePrice, variantPrice, type Look, type Product } from "@/types";
import {
  RunwayLooks,
  type RunwayLook,
} from "@/components/store/runway/RunwayLooks";

export const metadata = {
  title: "Сет хувцас",
  description:
    "Толгойноос хөл хүртэл бүрдүүлсэн сетүүд. Цэг дээр дарж хувцсыг нь харж, бүтэн сетээр нь сагсална уу.",
};
export const revalidate = 60;

export default async function SetsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("looks")
    .select(
      "*, look_items(*, products(*, brands(name), categories(name), product_colors(*), product_variants(*)))"
    )
    .eq("is_visible", true)
    .order("sort_order")
    .order("created_at");

  if (error) console.error("looks query failed:", error.message);

  const looks: RunwayLook[] = ((data ?? []) as unknown as Look[])
    .map((look) => {
      const items = [...(look.look_items ?? [])]
        .filter((it) => it.products && it.products.status === "published")
        .sort((a, b) => a.sort_order - b.sort_order);
      return {
        id: look.id,
        name: look.name,
        description: look.description,
        image: look.model_image_url,
        couponCode: look.coupon_code,
        discountPct: Number(look.discount_pct) || 0,
        pieces: items.map((it, i) => {
          const p = it.products as Product & {
            brands?: { name: string } | null;
            categories?: { name: string } | null;
          };
          const colors = p.product_colors ?? [];
          const variants = (p.product_variants ?? []).filter(
            (v) => v.status !== "inactive"
          );
          const price = effectivePrice(p);
          return {
            num: i + 1,
            pinX: Number(it.pin_x),
            pinY: Number(it.pin_y),
            isNew: it.is_new,
            product: {
              id: p.id,
              name: p.name,
              slug: p.slug,
              vendor: p.brands?.name || p.categories?.name || "Orasuits",
              image:
                p.main_image_url ||
                colors.find((c) => c.image_url)?.image_url ||
                look.model_image_url,
              price,
              compareAt: Number(p.base_price) > price ? Number(p.base_price) : null,
              colors: colors.map((c) => ({
                id: c.id,
                name: c.color_name,
                code: c.color_code,
                image: c.image_url,
              })),
              variants: variants.map((v) => ({
                id: v.id,
                colorId: v.color_id,
                size: v.size,
                stock: Math.max(0, v.stock_quantity),
                price: variantPrice(v, p),
              })),
            },
          };
        }),
      };
    })
    .filter((l) => l.pieces.length > 0);

  return <RunwayLooks looks={looks} />;
}
