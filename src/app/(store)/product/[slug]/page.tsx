import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { effectivePrice, type Product, type Review } from "@/types";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { ProductCarousel } from "@/components/store/ProductCarousel";
import { RecentlyViewed } from "@/components/store/RecentlyViewed";
import { ReviewSection } from "@/components/store/ReviewSection";

export const dynamic = "force-dynamic";

const PRODUCT_SELECT =
  "*, categories(*), brands(*), product_colors(*), product_variants(*), product_images(*), reviews(*)";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, slug, short_description, description, seo_title, seo_description, main_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return { title: "Бараа" };

  const title = data.seo_title || data.name;
  const description =
    data.seo_description ||
    data.short_description ||
    data.description ||
    `${data.name} — ${SITE_NAME} онлайн дэлгүүр.`;
  const url = `${SITE_URL}/product/${data.slug}`;
  const images = data.main_image_url ? [data.main_image_url] : [];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    // Old /product/[id] links keep working: look up by id, then redirect.
    if (UUID_RE.test(slug)) {
      const { data: byId } = await supabase
        .from("products")
        .select("slug")
        .eq("id", slug)
        .eq("status", "published")
        .maybeSingle();
      if (byId?.slug) redirect(`/product/${byId.slug}`);
    }
    notFound();
  }

  const product = data as unknown as Product;
  const approvedReviews = (product.reviews ?? []).filter(
    (r: Review) => r.is_approved
  );
  const avgRating = approvedReviews.length
    ? approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length
    : null;
  const inStock = (product.product_variants ?? []).some(
    (v) => v.stock_quantity > 0
  );
  const price = effectivePrice(product);
  const url = `${SITE_URL}/product/${product.slug}`;

  const galleryUrls = [
    product.main_image_url,
    ...(product.product_images ?? []).map((i) => i.url),
  ].filter(Boolean) as string[];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.short_description ?? product.description ?? undefined,
    image: Array.from(new Set(galleryUrls)),
    sku: product.sku ?? undefined,
    ...(product.brands
      ? { brand: { "@type": "Brand", name: product.brands.name } }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "MNT",
      price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount: approvedReviews.length,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Нүүр", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Дэлгүүр", item: `${SITE_URL}/shop` },
      ...(product.categories
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.categories.name,
              item: `${SITE_URL}/category/${product.categories.slug}`,
            },
            { "@type": "ListItem", position: 4, name: product.name, item: url },
          ]
        : [{ "@type": "ListItem", position: 3, name: product.name, item: url }]),
    ],
  };

  const { data: related } = await supabase
    .from("products")
    .select("*, categories(*), product_colors(*), product_variants(*)")
    .eq("status", "published")
    .eq("category_id", product.category_id ?? "")
    .neq("id", product.id)
    .limit(8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ProductDetailClient product={product} />

      <div className="mt-20">
        <ReviewSection productId={product.id} reviews={approvedReviews} />
      </div>

      <div className="mt-20">
        <ProductCarousel
          title="Төстэй бараа"
          products={(related ?? []) as unknown as Product[]}
        />
      </div>

      <div className="mt-20">
        <RecentlyViewed excludeId={product.id} />
      </div>
    </div>
  );
}
