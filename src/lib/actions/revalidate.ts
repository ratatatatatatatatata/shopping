"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Publish workflow: called by admin after any product/category/content change.
 * Ensures the storefront reflects changes immediately without a redeploy.
 * Verifies the caller is an admin server-side before revalidating.
 */
export async function revalidateStorefront(productSlug?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "super_admin"].includes(profile.role))
    return { ok: false };

  revalidatePath("/", "layout"); // home + all nested store pages
  revalidatePath("/shop");
  revalidatePath("/new-arrivals");
  revalidatePath("/sale");
  if (productSlug) revalidatePath(`/product/${productSlug}`);
  return { ok: true };
}
