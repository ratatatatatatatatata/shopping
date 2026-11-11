import { createClient } from "@/lib/supabase/server";
import type { Product, Category, HomepageSection } from "@/types";
import { HeroSection } from "@/components/store/HeroSection";
import { GarmentRail, type RailItem } from "@/components/store/GarmentRail";
import { effectivePrice } from "@/types";
import { formatPrice } from "@/utils/format";
import { ProductCarousel } from "@/components/store/ProductCarousel";
import { CategorySection } from "@/components/store/CategorySection";
import { PromoBanner } from "@/components/store/PromoBanner";
import { WhyUs } from "@/components/store/WhyUs";
import { InstaGallery } from "@/components/store/InstaGallery";
import {
  CustomerReviews,
  type HomeReview,
} from "@/components/store/CustomerReviews";
import { Newsletter } from "@/components/store/Newsletter";
import { DropSection, type DropConfig } from "@/components/store/drop/DropSection";

export const dynamic = "force-dynamic";

const PRODUCT_SELECT =
  "*, categories(*), product_colors(*), product_variants(*)";

export default async function HomePage() {
  const supabase = await createClient();

  const [
    featuredRes,
    newRes,
    bestRes,
    categoriesRes,
    sectionsRes,
    reviewsRes,
    railRes,
  ] = await Promise.all([
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("sort_order")
        .limit(8),
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "published")
        .eq("is_new_arrival", true)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "published")
        .eq("is_best_seller", true)
        .order("sort_order")
        .limit(8),
      supabase
        .from("categories")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order"),
      supabase.from("homepage_sections").select("*").eq("is_visible", true),
      supabase
        .from("reviews")
        .select("*, profiles(full_name), products(name, slug)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(3),
      // Garment rail (needs migration 202611110001; errors fall back below)
      supabase
        .from("products")
        .select(
          "id, name, slug, base_price, sale_price, sale_start_at, sale_end_at, main_image_url, rail_image_url"
        )
        .eq("status", "published")
        .eq("show_on_rail", true)
        .order("rail_sort")
        .order("sort_order")
        .limit(10),
    ]);

  const featured = (featuredRes.data ?? []) as unknown as Product[];
  let newArrivals = (newRes.data ?? []) as unknown as Product[];
  let bestSellers = (bestRes.data ?? []) as unknown as Product[];
  const categories = (categoriesRes.data ?? []) as Category[];
  const sections = (sectionsRes.data ?? []) as HomepageSection[];
  const reviews = (reviewsRes.data ?? []) as unknown as HomeReview[];

  // Fallbacks: no flagged new arrivals -> newest published products
  if (!newArrivals.length) {
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(8);
    newArrivals = (data ?? []) as unknown as Product[];
  }
  if (!bestSellers.length) bestSellers = featured;

  const hero = sections.find((s) => s.key === "hero");

  type RailRow = Pick<
    Product,
    | "id" | "name" | "slug" | "base_price" | "sale_price"
    | "sale_start_at" | "sale_end_at" | "main_image_url" | "rail_image_url"
  >;
  const toRail = (p: RailRow): RailItem | null => {
    const image = p.rail_image_url || p.main_image_url;
    if (!image) return null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: formatPrice(effectivePrice(p)),
      image,
    };
  };
  const railRows = (railRes.error ? [] : railRes.data ?? []) as RailRow[];
  let railItems = railRows.map(toRail).filter((r): r is RailItem => !!r);
  // Nothing flagged for the rail yet: hang featured / newest products instead
  if (!railItems.length) {
    const seen = new Set<string>();
    railItems = [...featured, ...newArrivals]
      .filter((p) => !seen.has(p.id) && seen.add(p.id))
      .map(toRail)
      .filter((r): r is RailItem => !!r)
      .slice(0, 10);
  }
  // Balloon-drop section (Admin → Агуулга → "Бөмбөлөгтэй хэсэг")
  const dropRow = sections.find((s) => s.key === "drop");
  const dc = (dropRow?.content ?? {}) as Record<string, unknown>;
  const str = (v: unknown, d: string) =>
    typeof v === "string" && v.trim() ? v : d;
  const num = (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && v !== "" && v != null ? n : d;
  };
  const drop: DropConfig | null = dropRow
    ? {
        headline: dropRow.title || "Таны өдөр бүрийн стиль. Таны хэмжээнд.",
        paragraph:
          dropRow.subtitle ||
          "Шинэ коллекц нэг дороос — өмсөхөд бэлэн, тохирох размертай.",
        linkUrl: dropRow.link_url || "/new-arrivals",
        tagline: str(dc.tagline, "Шинэ үеийн\nстиль"),
        word: str(dc.word, "orasuits"),
        cardText: str(dc.card_text, "Энгийн байдлыг сонго.\nШинэ коллекц\nOrasuits-д ирлээ."),
        cardButton: str(dc.card_button, "Шинэ коллекц үзэх"),
        garmentUrl: str(dc.garment_url, railItems[0]?.image ?? "") || null,
        cardImage:
          str(
            dc.card_image_url,
            featured[0]?.main_image_url ?? newArrivals[0]?.main_image_url ?? ""
          ) || null,
        sceneUrl: dropRow.image_url || null,
        landX: num(dc.land_x, 0.5),
        landY: num(dc.land_y, 0.64),
        textX: num(dc.text_x, 0.5),
        textY: num(dc.text_y, 0.14),
        landSize: num(dc.land_size, 0.34),
      }
    : null;

  const marquee = [
    "ORASUITS",
    (hero?.title || "Шинэ коллекц").toUpperCase(),
    (hero?.subtitle || "Тоо ширхэг хязгаартай").toUpperCase(),
  ];
  const promo = sections.find((s) => s.key === "promo");

  return (
    <div className="space-y-20 pb-4 sm:space-y-24">
      {railItems.length ? (
        <GarmentRail items={railItems} marquee={marquee} />
      ) : (
        <HeroSection
          products={featured.length ? featured : newArrivals}
          title={hero?.title}
          subtitle={hero?.subtitle}
        />
      )}
      <ProductCarousel title="Онцлох бараа" products={featured} href="/shop" />
      {drop && <DropSection config={drop} />}
      <CategorySection categories={categories} />
      <ProductCarousel
        title="Шинэ загварууд"
        products={newArrivals}
        href="/new-arrivals"
      />
      <PromoBanner
        title={promo?.title}
        subtitle={promo?.subtitle}
        linkUrl={promo?.link_url}
      />
      <ProductCarousel
        title="Эрэлттэй бараа"
        products={bestSellers}
        href="/shop?sort=popularity"
      />
      <WhyUs />
      <CustomerReviews reviews={reviews} />
      <InstaGallery products={newArrivals} />
      <Newsletter />
    </div>
  );
}
