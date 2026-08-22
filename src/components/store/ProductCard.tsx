"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, Heart } from "lucide-react";
import { effectivePrice, variantPrice, type Product } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, cn } from "@/utils/format";
import {
  isAvailableSizeVariant,
  uniqueSortedAvailableSizes,
} from "@/utils/sizes";
import { staggerItem } from "./AnimatedSection";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const wishlisted = useWishlist((s) => s.productIds.includes(product.id));
  const toggleWishlist = useWishlist((s) => s.toggle);

  const colors = product.product_colors ?? [];
  const variants = product.product_variants ?? [];
  const availableVariants = variants.filter(isAvailableSizeVariant);
  const sizes = uniqueSortedAvailableSizes(availableVariants);
  const inStock = availableVariants.length > 0;

  const basePrice = Number(product.base_price);
  const price = effectivePrice(product);
  const onSale = price < basePrice;
  const discountPct = onSale ? Math.round((1 - price / basePrice) * 100) : 0;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    const variant = availableVariants[0];
    if (!variant) return;
    const color = colors.find((c) => c.id === variant.color_id);
    addItem({
      variantId: variant.id,
      productId: product.id,
      colorId: variant.color_id,
      name: product.name,
      slug: product.slug,
      colorName: color?.color_name ?? "",
      colorCode: color?.color_code ?? "#000",
      size: variant.size,
      price: variantPrice(variant, product),
      imageUrl: color?.image_url ?? product.main_image_url ?? "",
      quantity: 1,
      stock: variant.stock_quantity,
    });
  }

  function toggleWish(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(product.id);
  }

  return (
    <motion.div variants={staggerItem} className="group">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-smoke">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.main_image_url ?? ""}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            style={{ objectPosition: product.image_position ?? "center" }}
          />
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <span className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white">
                Дууссан
              </span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {onSale && (
              <span className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                -{discountPct}%
              </span>
            )}
            {product.is_new_arrival && inStock && (
              <span className="rounded-full bg-electric px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Шинэ
              </span>
            )}
            {product.is_featured && inStock && (
              <span className="rounded-full bg-neon px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
                Онцлох
              </span>
            )}
          </div>
          {/* Wishlist heart */}
          <button
            onClick={toggleWish}
            aria-label="Хадгалах"
            className={cn(
              "absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition-all hover:scale-110",
              wishlisted ? "text-red-500" : "text-neutral-400 hover:text-ink"
            )}
          >
            <Heart className={cn("h-4 w-4", wishlisted && "fill-red-500")} />
          </button>
          {/* Hover actions */}
          <div className="absolute inset-x-3 bottom-3 flex translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {inStock && (
              <button
                onClick={quickAdd}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> Сагслах
              </button>
            )}
            <span className="flex items-center justify-center rounded-full bg-white px-3 py-2.5 shadow-sm">
              <Eye className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
        <div className="mt-3 px-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
            {onSale ? (
              <span className="whitespace-nowrap text-right text-sm">
                <span className="font-bold text-red-500">
                  {formatPrice(price)}
                </span>{" "}
                <span className="block text-xs text-neutral-400 line-through">
                  {formatPrice(basePrice)}
                </span>
              </span>
            ) : (
              <span className="whitespace-nowrap text-sm font-bold">
                {formatPrice(price)}
              </span>
            )}
          </div>
          {colors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {colors.slice(0, 4).map((c) => (
                <span
                  key={c.id}
                  title={c.color_name}
                  className="h-3.5 w-3.5 rounded-full border border-ink/10"
                  style={{ backgroundColor: c.color_code }}
                />
              ))}
              {colors.length > 4 && (
                <span className="ml-0.5 text-[10px] font-medium text-neutral-400">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          )}
          {sizes.length > 0 && (
            <ul
              aria-label={`Бэлэн размер: ${sizes.join(", ")}`}
              className="mt-2 flex w-full max-w-full flex-wrap items-center gap-1 overflow-visible"
            >
              {sizes.map((size) => (
                <li
                  key={size}
                  className="inline-flex min-w-7 max-w-full items-center justify-center break-words rounded-md border border-ink/15 bg-white px-1.5 py-1 text-[10px] font-semibold leading-none text-ink transition-colors group-hover:border-ink/40"
                >
                  {size}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
