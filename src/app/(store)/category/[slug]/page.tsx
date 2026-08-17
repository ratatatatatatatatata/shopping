import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Product, Category } from "@/types";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { ProductGrid } from "@/components/store/ProductGrid";

export const revalidate = 60;

const PRODUCT_SELECT =
  "*, categories(*), product_colors(*), product_variants(*)";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name, slug, image_url, image_position")
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();

  if (!data) return { title: "Ангилал" };
  const title = data.name;
  const description = `${data.name} — ${SITE_NAME} онлайн дэлгүүрийн ${data.name} ангиллын бараанууд.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/category/${data.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/category/${data.slug}`,
      siteName: SITE_NAME,
      images: data.image_url ? [data.image_url] : [],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: categoryRow } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();

  if (!categoryRow) notFound();
  const category = categoryRow as Category;

  // Include child categories (one level of parent_id nesting)
  const { data: children } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", category.id);
  const categoryIds = [
    category.id,
    ...((children ?? []) as { id: string }[]).map((c) => c.id),
  ];

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .in("category_id", categoryIds)
    .order("created_at", { ascending: false });

  const products = (data ?? []) as unknown as Product[];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Нүүр", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Дэлгүүр", item: `${SITE_URL}/shop` },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${SITE_URL}/category/${category.slug}`,
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Category header */}
      <div className="relative overflow-hidden bg-ink text-white">
        {category.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.image_url}
            alt={category.name}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            style={{ objectPosition: category.image_position ?? "center" }}
          />
        )}
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-grape/30 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neon">
            Ангилал
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">
            {category.name}
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Нийт {products.length} бараа
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
