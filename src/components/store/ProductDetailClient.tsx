"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  Zap,
  Check,
  Heart,
  Box,
  ImageIcon,
  ChevronDown,
  Truck,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import {
  effectivePrice,
  variantPrice,
  type Product,
  type ProductColor,
  type ProductVariant,
} from "@/types";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, cn } from "@/utils/format";
import { ProductGallery } from "./ProductGallery";
import { ColorSelector } from "./ColorSelector";
import { SizeSelector } from "./SizeSelector";
import { QuantitySelector } from "./QuantitySelector";

const ProductViewer3D = dynamic(
  () => import("./ProductViewer3D").then((m) => m.ProductViewer3D),
  { ssr: false }
);

const RECENTLY_VIEWED_KEY = "orasuits-recently-viewed";

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-neutral-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm leading-relaxed text-neutral-600">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const wishlisted = useWishlist((s) => s.productIds.includes(product.id));
  const toggleWishlist = useWishlist((s) => s.toggle);

  const colors = product.product_colors ?? [];
  const variants = product.product_variants ?? [];
  const productImages = product.product_images ?? [];

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    colors[0] ?? null
  );
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [show3D, setShow3D] = useState(false);

  // Record into "recently viewed" (max 8, newest first)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      const next = [product.id, ...ids.filter((id) => id !== product.id)].slice(
        0,
        8
      );
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — ignore
    }
  }, [product.id]);

  const colorVariants = useMemo(
    () =>
      variants.filter(
        (v) => v.color_id === selectedColor?.id && v.status === "active"
      ),
    [variants, selectedColor]
  );

  // Gallery: product_images sorted by sort_order; selected color's images
  // first, then the rest. Falls back to color/main image urls.
  const galleryImages = useMemo(() => {
    const sorted = [...productImages].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    let urls: string[];
    if (sorted.length) {
      const colorImgs = selectedColor
        ? sorted.filter((i) => i.color_id === selectedColor.id).map((i) => i.url)
        : [];
      const rest = sorted
        .filter((i) => !selectedColor || i.color_id !== selectedColor.id)
        .map((i) => i.url);
      urls = [...colorImgs, ...rest];
    } else {
      urls = [
        selectedColor?.image_url,
        product.main_image_url,
        ...colors.map((c) => c.image_url),
      ].filter(Boolean) as string[];
    }
    return Array.from(new Set(urls));
  }, [productImages, selectedColor, product.main_image_url, colors]);

  // url -> object-position: per-image setting, product-level fallback
  const imagePositions = useMemo(() => {
    const fallback = product.image_position ?? "center";
    const map: Record<string, string> = {};
    for (const img of productImages) {
      map[img.url] = img.object_position ?? fallback;
    }
    if (product.main_image_url && !map[product.main_image_url]) {
      map[product.main_image_url] = fallback;
    }
    for (const c of colors) {
      if (c.image_url && !map[c.image_url]) map[c.image_url] = fallback;
    }
    return map;
  }, [productImages, product.main_image_url, product.image_position, colors]);

  const displayedImage =
    activeImage && galleryImages.includes(activeImage)
      ? activeImage
      : galleryImages[0] ?? product.main_image_url ?? "";

  // Pricing (sale window + variant overrides respected)
  const currentPrice = selectedVariant
    ? variantPrice(selectedVariant, product)
    : effectivePrice(product);
  const originalPrice = selectedVariant
    ? Number(selectedVariant.price ?? product.base_price)
    : Number(product.base_price);
  const onSale = currentPrice < originalPrice;
  const discountPct = onSale
    ? Math.round((1 - currentPrice / originalPrice) * 100)
    : 0;

  function handleSelectColor(color: ProductColor) {
    setSelectedColor(color);
    setSelectedVariant(null);
    setQuantity(1);
    setActiveImage(null);
  }

  function handleImageSelect(url: string) {
    setActiveImage(url);
    // Selecting a color's fallback image also syncs the color
    const match = colors.find((c) => c.image_url === url);
    if (match && match.id !== selectedColor?.id) handleSelectColor(match);
  }

  function buildItem() {
    if (!selectedVariant || !selectedColor) return null;
    return {
      variantId: selectedVariant.id,
      productId: product.id,
      colorId: selectedColor.id,
      name: product.name,
      slug: product.slug,
      colorName: selectedColor.color_name,
      colorCode: selectedColor.color_code,
      size: selectedVariant.size,
      price: currentPrice,
      imageUrl: displayedImage,
      quantity,
      stock: selectedVariant.stock_quantity,
    };
  }

  function handleAddToCart() {
    const item = buildItem();
    if (!item) return;
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    const item = buildItem();
    if (!item) return;
    addItem(item);
    useCart.getState().close();
    router.push("/checkout");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {show3D && product.model_url ? (
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-smoke">
            <ProductViewer3D
              modelUrl={product.model_url}
              fallbackImage={displayedImage}
              alt={product.name}
            />
          </div>
        ) : (
          <ProductGallery
            images={galleryImages}
            positions={imagePositions}
            activeImage={displayedImage}
            onSelect={handleImageSelect}
            alt={product.name}
          />
        )}
        {product.model_url && (
          <button
            type="button"
            onClick={() => setShow3D((v) => !v)}
            className="btn-outline mt-3 w-full !py-2.5 text-xs"
          >
            {show3D ? (
              <>
                <ImageIcon className="h-4 w-4" /> Зураг үзэх
              </>
            ) : (
              <>
                <Box className="h-4 w-4" /> 3D үзэх
              </>
            )}
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-7"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            {product.categories && <span>{product.categories.name}</span>}
            {product.brands && (
              <>
                <span className="text-neutral-300">·</span>
                <span>{product.brands.name}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {product.name}
            </h1>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Хадгалах"
              className={cn(
                "shrink-0 rounded-full border border-ink/10 p-3 transition-all hover:scale-110",
                wishlisted
                  ? "border-red-200 bg-red-50 text-red-500"
                  : "text-neutral-400 hover:border-ink hover:text-ink"
              )}
            >
              <Heart
                className={cn("h-5 w-5", wishlisted && "fill-red-500")}
              />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {onSale ? (
              <>
                <p className="font-display text-2xl font-bold text-red-500">
                  {formatPrice(currentPrice)}
                </p>
                <p className="text-base font-semibold text-neutral-400 line-through">
                  {formatPrice(originalPrice)}
                </p>
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white">
                  -{discountPct}%
                </span>
              </>
            ) : (
              <p className="font-display text-2xl font-bold text-gradient">
                {formatPrice(currentPrice)}
              </p>
            )}
          </div>
        </div>

        {(product.short_description || product.description) && (
          <p className="text-sm leading-relaxed text-neutral-600">
            {product.short_description ?? product.description}
          </p>
        )}

        <ColorSelector
          colors={colors}
          selected={selectedColor}
          onSelect={handleSelectColor}
        />

        <SizeSelector
          variants={colorVariants}
          selected={selectedVariant}
          sizeGuide={product.size_guide}
          onSelect={(v) => {
            setSelectedVariant(v);
            setQuantity(1);
          }}
        />

        <div className="flex items-center gap-4">
          <span className="label !mb-0">Тоо ширхэг</span>
          <QuantitySelector
            quantity={quantity}
            max={selectedVariant?.stock_quantity ?? 1}
            onChange={setQuantity}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            className="btn-primary flex-1"
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> Нэмэгдлээ!
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Сагсанд нэмэх
              </>
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleBuyNow}
            disabled={!selectedVariant}
            className="btn-neon flex-1"
          >
            <Zap className="h-4 w-4" /> Шууд авах
          </motion.button>
        </div>
        {!selectedVariant && (
          <p className="-mt-3 text-xs text-neutral-400">
            Размераа сонгосны дараа сагсанд нэмэх боломжтой.
          </p>
        )}

        {/* Details accordions */}
        <div className="border-t border-ink/10">
          {product.description && (
            <Accordion title="Дэлгэрэнгүй тайлбар" defaultOpen>
              {product.description}
            </Accordion>
          )}
          {product.material && (
            <Accordion title="Материал">{product.material}</Accordion>
          )}
          {product.care_instructions && (
            <Accordion title="Арчилгааны заавар">
              {product.care_instructions}
            </Accordion>
          )}
        </div>

        {/* Shipping / return info */}
        <div className="grid gap-3 rounded-2xl bg-smoke/70 p-5 text-xs text-neutral-600 sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
            <span>
              УБ хотод 24–48 цагт хүргэнэ. 200,000₮-с дээш захиалгад хүргэлт
              үнэгүй.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 text-grape" />
            <span>Хүлээн авснаас хойш 7 хоногийн дотор буцаах боломжтой.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>100% жинхэнэ бүтээгдэхүүн, найдвартай төлбөр.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
