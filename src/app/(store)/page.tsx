import { createClient } from "@/lib/supabase/server";
import type { Product, Category, HomepageSection } from "@/types";
import { HeroSection } from "@/components/store/HeroSection";
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

export const dynamic = "force-dynamic";

const PRODUCT_SELECT =
  "*, categories(*), product_colors(*), product_variants(*)";

export default async function HomePage() {
  const supabase = await createClient();

  const [featuredRes, newRes, bestRes, categoriesRes, sectionsRes, reviewsRes] =
    await Promise.all([
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
  const promo = sections.find((s) => s.key === "promo");

  return (
    <div className="space-y-20 pb-4 sm:space-y-24">
      <HeroSection
        products={featured.length ? featured : newArrivals}
        title={hero?.title}
        subtitle={hero?.subtitle}
      />
      <ProductCarousel title="Онцлох бараа" products={featured} href="/shop" />
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
