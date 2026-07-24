"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

interface WishlistState {
  productIds: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  setAll: (ids: string[]) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const has = get().productIds.includes(productId);
        set((s) => ({
          productIds: has
            ? s.productIds.filter((id) => id !== productId)
            : [...s.productIds, productId],
        }));
        // Fire-and-forget sync to Supabase when logged in
        syncWishlistItem(productId, !has);
      },
      has: (productId) => get().productIds.includes(productId),
      setAll: (ids) => set({ productIds: ids }),
    }),
    { name: "orasuits-wishlist" }
  )
);

async function syncWishlistItem(productId: string, add: boolean) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    let { data: wl } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!wl) {
      const { data } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id })
        .select("id")
        .single();
      wl = data;
    }
    if (!wl) return;
    if (add) {
      await supabase
        .from("wishlist_items")
        .upsert(
          { wishlist_id: wl.id, product_id: productId },
          { onConflict: "wishlist_id,product_id" }
        );
    } else {
      await supabase
        .from("wishlist_items")
        .delete()
        .eq("wishlist_id", wl.id)
        .eq("product_id", productId);
    }
  } catch {
    // offline/guest: local persistence is enough
  }
}

/** Merge server wishlist into local store after login. */
export async function pullWishlistFromServer() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: wl } = await supabase
      .from("wishlists")
      .select("id, wishlist_items(product_id)")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!wl) return;
    const serverIds = (wl.wishlist_items ?? []).map(
      (i: { product_id: string }) => i.product_id
    );
    const local = useWishlist.getState().productIds;
    useWishlist.getState().setAll(Array.from(new Set([...local, ...serverIds])));
  } catch {
    // ignore
  }
}
