import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "published"),
    supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_visible", true),
  ]);

  type SitemapEntry = MetadataRoute.Sitemap[number];

  const staticEntries: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/new-arrivals",
    "/sale",
    "/search",
    "/about",
    "/contact",
    "/shipping",
    "/returns",
    "/terms",
    "/privacy-policy",
  ].map(
    (path): SitemapEntry => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: path === "" || path === "/shop" ? "daily" : "weekly",
      priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.5,
    })
  );

  const productEntries: MetadataRoute.Sitemap = (
    (products ?? []) as { slug: string; updated_at: string | null }[]
  ).map(
    (p): SitemapEntry => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const categoryEntries: MetadataRoute.Sitemap = (
    (categories ?? []) as { slug: string; updated_at: string | null }[]
  ).map(
    (c): SitemapEntry => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
