"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Eye,
  Globe,
  GlobeLock,
  Archive,
  Copy,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidateStorefront } from "@/lib/actions/revalidate";
import { logAdminAction } from "@/lib/actions/adminLog";
import type { ProductStatus } from "@/types";

export function ProductRowActions({
  productId,
  slug,
  name,
  status,
}: {
  productId: string;
  slug: string;
  name: string;
  status: ProductStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function togglePublish() {
    setLoading(true);
    const supabase = createClient();
    const publish = status !== "published";
    const { error } = await supabase
      .from("products")
      .update({
        status: publish ? "published" : "draft",
        published_at: publish ? new Date().toISOString() : null,
      })
      .eq("id", productId);
    if (!error) {
      await revalidateStorefront(slug);
      await logAdminAction(
        publish ? "product.publish" : "product.unpublish",
        "products",
        productId,
        { name }
      );
    }
    setLoading(false);
    router.refresh();
  }

  async function handleArchive() {
    if (!confirm(`"${name}" барааг архивлах уу?`)) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ status: "archived" })
      .eq("id", productId);
    if (!error) {
      await revalidateStorefront(slug);
      await logAdminAction("product.archive", "products", productId, { name });
    }
    setLoading(false);
    router.refresh();
  }

  async function handleDuplicate() {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data: source, error: srcErr } = await supabase
        .from("products")
        .select("*, product_colors(*), product_variants(*), product_images(*)")
        .eq("id", productId)
        .single();
      if (srcErr || !source) throw srcErr;

      const {
        id: _id,
        created_at: _c,
        updated_at: _u,
        product_colors,
        product_variants,
        product_images,
        ...productFields
      } = source;
      void _id;
      void _c;
      void _u;

      const { data: copy, error: insErr } = await supabase
        .from("products")
        .insert({
          ...productFields,
          name: `${source.name} (хуулбар)`,
          slug: `${source.slug}-copy-${Date.now().toString(36)}`,
          status: "draft",
          published_at: null,
        })
        .select("id")
        .single();
      if (insErr || !copy) throw insErr;

      // Copy colors, keep an old->new id map
      const colorMap = new Map<string, string>();
      for (const c of product_colors ?? []) {
        const { data: newColor, error } = await supabase
          .from("product_colors")
          .insert({
            product_id: copy.id,
            color_name: c.color_name,
            color_code: c.color_code,
            image_url: c.image_url,
          })
          .select("id")
          .single();
        if (error || !newColor) throw error;
        colorMap.set(c.id, newColor.id);
      }

      // Copy variants
      for (const v of product_variants ?? []) {
        const newColorId = colorMap.get(v.color_id);
        if (!newColorId) continue;
        const { error } = await supabase.from("product_variants").insert({
          product_id: copy.id,
          color_id: newColorId,
          size: v.size,
          stock_quantity: v.stock_quantity,
          sku: v.sku,
          price: v.price,
          sale_price: v.sale_price,
          status: v.status,
        });
        if (error) throw error;
      }

      // Copy gallery images
      for (const img of product_images ?? []) {
        const { error } = await supabase.from("product_images").insert({
          product_id: copy.id,
          color_id: img.color_id ? (colorMap.get(img.color_id) ?? null) : null,
          url: img.url,
          alt: img.alt,
          sort_order: img.sort_order,
          is_cover: img.is_cover,
        });
        if (error) throw error;
      }

      await logAdminAction("product.duplicate", "products", copy.id, {
        source_id: productId,
        name,
      });
    } catch {
      alert("Хуулбарлахад алдаа гарлаа.");
    }
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`"${name}" барааг бүрмөсөн устгах уу?`)) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (!error) {
      await revalidateStorefront(slug);
      await logAdminAction("product.delete", "products", productId, { name });
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
      ) : (
        <>
          <Link
            href={`/admin/products/${productId}`}
            title="Засах"
            className="rounded-full p-2 text-neutral-500 hover:bg-smoke"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Link
            href={`/product/${slug}`}
            target="_blank"
            title="Дэлгүүрт үзэх"
            className="rounded-full p-2 text-neutral-500 hover:bg-smoke"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={togglePublish}
            title={
              status === "published" ? "Нийтлэлээс буулгах" : "Нийтлэх"
            }
            className="rounded-full p-2 text-neutral-500 hover:bg-smoke"
          >
            {status === "published" ? (
              <GlobeLock className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </button>
          {status !== "archived" && (
            <button
              onClick={handleArchive}
              title="Архивлах"
              className="rounded-full p-2 text-neutral-500 hover:bg-smoke"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleDuplicate}
            title="Хуулбарлах"
            className="rounded-full p-2 text-neutral-500 hover:bg-smoke"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            title="Устгах"
            className="rounded-full p-2 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
