"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Loader2, Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { revalidateStorefront } from "@/lib/actions/revalidate";
import { logAdminAction } from "@/lib/actions/adminLog";
import { productSchema, type ProductFormValues } from "@/lib/validation";
import { GENDER_LABELS } from "@/lib/constants";
import { slugify } from "@/utils/format";
import type { Brand, Category, Gender, Product } from "@/types";
import { VariantManager, type ColorDraft } from "./VariantManager";
import { ImageManager, type ImageDraft } from "./ImageManager";

const MAX_MODEL_SIZE = 20 * 1024 * 1024; // 20MB

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type SaveMode = "draft" | "published" | "keep";

export function ProductForm({
  categories,
  brands,
  product,
}: {
  categories: Category[];
  brands: Brand[];
  product?: Product; // edit mode if provided
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      category_id: product?.category_id ?? categories[0]?.id ?? "",
      brand_id: product?.brand_id ?? "",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      gender: (product?.gender ?? "unisex") as Gender,
      short_description: product?.short_description ?? "",
      description: product?.description ?? "",
      material: product?.material ?? "",
      care_instructions: product?.care_instructions ?? "",
      base_price: product ? Number(product.base_price) : 0,
      sale_price: product?.sale_price != null ? Number(product.sale_price) : null,
      cost_price: product?.cost_price != null ? Number(product.cost_price) : null,
      seo_title: product?.seo_title ?? "",
      seo_description: product?.seo_description ?? "",
    },
  });

  // ----- state kept outside react-hook-form -----
  const [brandList, setBrandList] = useState<Brand[]>(brands);
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);

  const [tagsInput, setTagsInput] = useState((product?.tags ?? []).join(", "));
  const [saleStartAt, setSaleStartAt] = useState(
    toLocalInput(product?.sale_start_at)
  );
  const [saleEndAt, setSaleEndAt] = useState(toLocalInput(product?.sale_end_at));
  const [flags, setFlags] = useState({
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
    is_best_seller: product?.is_best_seller ?? false,
    sort_order: product?.sort_order ?? 0,
  });

  const [mainImage, setMainImage] = useState<{
    file?: File;
    previewUrl?: string;
    url: string;
  }>({ url: product?.main_image_url ?? "" });

  const [modelUrl, setModelUrl] = useState(product?.model_url ?? "");
  const [modelFile, setModelFile] = useState<File | null>(null);

  const [colors, setColors] = useState<ColorDraft[]>(
    (product?.product_colors ?? []).map((c) => ({
      id: c.id,
      _key: c.id,
      color_name: c.color_name,
      color_code: c.color_code,
      image_url: c.image_url ?? "",
      sizes: (product?.product_variants ?? [])
        .filter((v) => v.color_id === c.id)
        .map((v) => ({
          id: v.id,
          size: v.size,
          stock_quantity: v.stock_quantity,
          sku: v.sku ?? "",
          price: v.price?.toString() ?? "",
          sale_price: v.sale_price?.toString() ?? "",
          status: v.status ?? "active",
        })),
    }))
  );

  const [images, setImages] = useState<ImageDraft[]>(
    [...(product?.product_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        id: img.id,
        _key: img.id,
        url: img.url,
        alt: img.alt ?? "",
        colorKey: img.color_id, // existing colors use their id as _key
        is_cover: img.is_cover,
      }))
  );

  async function createBrand() {
    const name = newBrandName.trim();
    if (!name) return;
    setCreatingBrand(true);
    const { data, error: err } = await supabase
      .from("brands")
      .insert({ name, slug: slugify(name), is_visible: true })
      .select("*")
      .single();
    setCreatingBrand(false);
    if (err || !data) {
      setError("Брэнд үүсгэхэд алдаа гарлаа: " + (err?.message ?? ""));
      return;
    }
    const brand = data as Brand;
    setBrandList((prev) => [...prev, brand]);
    setValue("brand_id", brand.id);
    setNewBrandName("");
    await logAdminAction("brand.create", "brands", brand.id, { name });
  }

  function handleModelFile(file: File | undefined) {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb" && ext !== "gltf") {
      setError("Зөвхөн .glb эсвэл .gltf файл сонгоно уу.");
      return;
    }
    if (file.size > MAX_MODEL_SIZE) {
      setError("3D загварын файл 20MB-аас том байна.");
      return;
    }
    setError(null);
    setModelFile(file);
  }

  async function save(values: ProductFormValues, mode: SaveMode) {
    setError(null);

    const validColors = colors.filter((c) => c.color_name.trim());
    if (!validColors.length) {
      setError("Дор хаяж нэг өнгө нэмнэ үү.");
      return;
    }

    setLoading(true);
    try {
      // 1. Uploads
      let mainImageUrl = mainImage.url;
      if (mainImage.file)
        mainImageUrl = await uploadImage(mainImage.file, "product-images");

      let finalModelUrl = modelUrl.trim();
      if (modelFile)
        finalModelUrl = await uploadImage(modelFile, "product-models");

      // 2. Status
      const status =
        mode === "keep" ? (product?.status ?? "draft") : mode;
      const publishedAt =
        status === "published"
          ? (product?.published_at ?? new Date().toISOString())
          : product?.published_at ?? null;

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const productData = {
        name: values.name,
        category_id: values.category_id || null,
        brand_id: values.brand_id || null,
        sku: values.sku || null,
        barcode: values.barcode || null,
        gender: values.gender,
        short_description: values.short_description || null,
        description: values.description || null,
        material: values.material || null,
        care_instructions: values.care_instructions || null,
        base_price: values.base_price,
        sale_price: values.sale_price ? values.sale_price : null,
        cost_price: values.cost_price ? values.cost_price : null,
        sale_start_at: saleStartAt ? new Date(saleStartAt).toISOString() : null,
        sale_end_at: saleEndAt ? new Date(saleEndAt).toISOString() : null,
        main_image_url: mainImageUrl || null,
        model_url: finalModelUrl || null,
        status,
        published_at: publishedAt,
        is_featured: flags.is_featured,
        is_new_arrival: flags.is_new_arrival,
        is_best_seller: flags.is_best_seller,
        sort_order: Number(flags.sort_order) || 0,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        tags,
      };

      // 3. Product upsert
      let productId = product?.id;
      let slug = product?.slug ?? "";
      if (productId) {
        const { error: err } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);
        if (err) throw err;
      } else {
        slug = slugify(values.name);
        const { data, error: err } = await supabase
          .from("products")
          .insert({ ...productData, slug })
          .select("id")
          .single();
        if (err) throw err;
        productId = data.id;
      }

      // 4. Remove colors deleted in the UI (cascades to variants)
      if (product) {
        const keptIds = validColors.map((c) => c.id).filter(Boolean);
        const removed = (product.product_colors ?? []).filter(
          (c) => !keptIds.includes(c.id)
        );
        for (const c of removed) {
          await supabase.from("product_colors").delete().eq("id", c.id);
        }
      }

      // 5. Colors + variants
      const colorIdByKey = new Map<string, string>();
      const originalVariants = product?.product_variants ?? [];

      for (const color of validColors) {
        let colorImageUrl = color.image_url;
        if (color.file)
          colorImageUrl = await uploadImage(color.file, "product-images");
        if (!colorImageUrl) colorImageUrl = mainImageUrl;

        let colorId = color.id;
        const colorData = {
          product_id: productId,
          color_name: color.color_name,
          color_code: color.color_code,
          image_url: colorImageUrl,
        };
        if (colorId) {
          const { error: err } = await supabase
            .from("product_colors")
            .update(colorData)
            .eq("id", colorId);
          if (err) throw err;
        } else {
          const { data, error: err } = await supabase
            .from("product_colors")
            .insert(colorData)
            .select("id")
            .single();
          if (err) throw err;
          colorId = data.id;
        }
        colorIdByKey.set(color._key, colorId as string);

        // Remove deleted sizes
        if (color.id && product) {
          const keptVariantIds = color.sizes.map((s) => s.id).filter(Boolean);
          const removedVariants = originalVariants.filter(
            (v) => v.color_id === color.id && !keptVariantIds.includes(v.id)
          );
          for (const v of removedVariants) {
            await supabase.from("product_variants").delete().eq("id", v.id);
          }
        }

        for (const s of color.sizes.filter((x) => x.size.trim())) {
          const base = {
            product_id: productId,
            color_id: colorId,
            size: s.size,
            sku: s.sku || null,
            price: s.price ? Number(s.price) : values.base_price,
            sale_price: s.sale_price ? Number(s.sale_price) : null,
            status: s.status,
          };
          if (s.id) {
            // Update everything except stock, then adjust stock via RPC.
            const { error: err } = await supabase
              .from("product_variants")
              .update(base)
              .eq("id", s.id);
            if (err) throw err;
            const original = originalVariants.find((v) => v.id === s.id);
            const delta =
              Number(s.stock_quantity) - Number(original?.stock_quantity ?? 0);
            if (delta !== 0) {
              const { error: rpcErr } = await supabase.rpc("adjust_stock", {
                p_variant_id: s.id,
                p_change: delta,
                p_type: "manual_adjustment",
                p_note: "Admin edit",
              });
              if (rpcErr)
                throw new Error(
                  rpcErr.message === "INSUFFICIENT_STOCK"
                    ? "Үлдэгдэл хүрэлцэхгүй байна."
                    : rpcErr.message
                );
            }
          } else {
            const { data: created, error: err } = await supabase
              .from("product_variants")
              .insert({ ...base, stock_quantity: Number(s.stock_quantity) })
              .select("id")
              .single();
            if (err) throw err;
            if (Number(s.stock_quantity) !== 0) {
              await supabase.from("inventory_transactions").insert({
                variant_id: created.id,
                type: "initial_stock",
                quantity_change: Number(s.stock_quantity),
                note: "Анхны үлдэгдэл",
              });
            }
          }
        }
      }

      // 6. Image gallery
      const keptImageIds = images.map((img) => img.id).filter(Boolean);
      const removedImages = (product?.product_images ?? []).filter(
        (img) => !keptImageIds.includes(img.id)
      );
      for (const img of removedImages) {
        await supabase.from("product_images").delete().eq("id", img.id);
      }
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let url = img.url;
        if (img.file) url = await uploadImage(img.file, "product-images");
        const row = {
          product_id: productId,
          color_id: img.colorKey
            ? (colorIdByKey.get(img.colorKey) ?? null)
            : null,
          url,
          alt: img.alt || null,
          sort_order: i,
          is_cover: img.is_cover,
        };
        if (img.id) {
          const { error: err } = await supabase
            .from("product_images")
            .update(row)
            .eq("id", img.id);
          if (err) throw err;
        } else {
          const { error: err } = await supabase
            .from("product_images")
            .insert(row);
          if (err) throw err;
        }
      }

      // 7. Revalidate + log
      await revalidateStorefront(slug);
      await logAdminAction(
        product ? "product.update" : "product.create",
        "products",
        productId,
        { name: values.name, status }
      );

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  const genderOptions = Object.entries(GENDER_LABELS) as [Gender, string][];

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-6 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        {/* a) Basic */}
        <div className="card p-6">
          <h2 className="mb-5 font-display text-lg font-bold">
            Үндсэн мэдээлэл
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Барааны нэр *</label>
              <input
                className="input"
                {...register("name")}
                placeholder="Oversized Hoodie"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Ангилал *</label>
                <select className="input" {...register("category_id")}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.category_id.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Хүйс</label>
                <select className="input" {...register("gender")}>
                  {genderOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Брэнд</label>
              <select className="input" {...register("brand_id")}>
                <option value="">— Брэндгүй —</option>
                {brandList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  className="input flex-1 !py-2 text-xs"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Шинэ брэндийн нэр"
                />
                <button
                  type="button"
                  onClick={createBrand}
                  disabled={creatingBrand || !newBrandName.trim()}
                  className="btn-outline !px-3 !py-2 text-xs"
                >
                  {creatingBrand ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Брэнд нэмэх
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">SKU</label>
                <input
                  className="input"
                  {...register("sku")}
                  placeholder="KHET-001"
                />
              </div>
              <div>
                <label className="label">Баркод</label>
                <input
                  className="input"
                  {...register("barcode")}
                  placeholder="8690000000000"
                />
              </div>
            </div>
            <div>
              <label className="label">Богино тайлбар</label>
              <input
                className="input"
                {...register("short_description")}
                placeholder="Жагсаалтад харагдах богино тайлбар"
              />
            </div>
            <div>
              <label className="label">Тайлбар</label>
              <textarea
                className="input min-h-[100px]"
                {...register("description")}
                placeholder="Барааны дэлгэрэнгүй тайлбар..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Материал</label>
                <input
                  className="input"
                  {...register("material")}
                  placeholder="100% хөвөн"
                />
              </div>
              <div>
                <label className="label">Арчилгааны заавар</label>
                <input
                  className="input"
                  {...register("care_instructions")}
                  placeholder="30°C-т угаана"
                />
              </div>
            </div>
            <div>
              <label className="label">Шошго (таслалаар тусгаарлана)</label>
              <input
                className="input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="hoodie, street, шинэ"
              />
            </div>
          </div>
        </div>

        {/* b) Pricing */}
        <div className="card p-6">
          <h2 className="mb-5 font-display text-lg font-bold">Үнэ</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Үндсэн үнэ (₮) *</label>
              <input
                type="number"
                min={0}
                className="input"
                {...register("base_price")}
                placeholder="99000"
              />
              {errors.base_price && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.base_price.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Хямдралтай үнэ (₮)</label>
              <input
                type="number"
                min={0}
                className="input"
                {...register("sale_price")}
                placeholder="79000"
              />
            </div>
            <div>
              <label className="label">Өртөг (₮)</label>
              <input
                type="number"
                min={0}
                className="input"
                {...register("cost_price")}
                placeholder="45000"
              />
            </div>
            <div>
              <label className="label">Хямдрал эхлэх</label>
              <input
                type="datetime-local"
                className="input"
                value={saleStartAt}
                onChange={(e) => setSaleStartAt(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Хямдрал дуусах</label>
              <input
                type="datetime-local"
                className="input"
                value={saleEndAt}
                onChange={(e) => setSaleEndAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* f) Image gallery */}
        <div className="card p-6">
          <h2 className="mb-2 font-display text-lg font-bold">Зургийн цомог</h2>
          <p className="mb-5 text-xs text-neutral-500">
            Барааны дэлгэрэнгүй хуудсанд харагдах зургууд. Өнгө оноовол тухайн
            өнгө сонгоход харагдана.
          </p>
          <ImageManager images={images} onChange={setImages} colors={colors} />
        </div>

        {/* g) Variants */}
        <div className="card p-6">
          <h2 className="mb-2 font-display text-lg font-bold">
            Өнгөний хувилбарууд
          </h2>
          <p className="mb-5 text-xs text-neutral-500">
            Өнгө бүр өөрийн зурагтай. Үлдэгдлийн өөрчлөлт inventory-д
            бүртгэгдэнэ.
          </p>
          <VariantManager colors={colors} onChange={setColors} />
        </div>

        {/* d) SEO */}
        <div className="card p-6">
          <h2 className="mb-5 font-display text-lg font-bold">SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="label">SEO гарчиг</label>
              <input
                className="input"
                {...register("seo_title")}
                placeholder="Oversized Hoodie — KHET"
              />
            </div>
            <div>
              <label className="label">SEO тайлбар</label>
              <textarea
                className="input min-h-[70px]"
                {...register("seo_description")}
                placeholder="Хайлтын үр дүнд харагдах тайлбар..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* e) Main image */}
        <div className="card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Үндсэн зураг</h2>
          <label className="group relative flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/15 bg-smoke">
            {mainImage.previewUrl || mainImage.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage.previewUrl || mainImage.url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center text-neutral-400">
                <Upload className="mx-auto h-7 w-7" />
                <p className="mt-2 text-xs">Зураг сонгох</p>
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              Зураг солих
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  setMainImage({
                    ...mainImage,
                    file,
                    previewUrl: URL.createObjectURL(file),
                  });
              }}
            />
          </label>
        </div>

        {/* e) 3D model */}
        <div className="card space-y-3 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Box className="h-4 w-4" /> 3D загвар
          </h2>
          <label className="btn-outline w-full cursor-pointer !py-2.5 text-xs">
            <Upload className="h-4 w-4" />
            {modelFile ? modelFile.name : "GLB / GLTF файл сонгох"}
            <input
              type="file"
              accept=".glb,.gltf"
              className="hidden"
              onChange={(e) => handleModelFile(e.target.files?.[0])}
            />
          </label>
          <div>
            <label className="label">эсвэл шууд URL</label>
            <input
              className="input !py-2 text-xs"
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              placeholder="https://.../model.glb"
            />
          </div>
          <p className="text-[11px] text-neutral-400">
            Дээд хэмжээ 20MB. Файл сонговол URL-ыг дарж бичнэ.
          </p>
        </div>

        {/* c) Flags */}
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-bold">Онцлох тохиргоо</h2>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm font-medium">Онцлох бараа</span>
            <input
              type="checkbox"
              checked={flags.is_featured}
              onChange={(e) =>
                setFlags({ ...flags, is_featured: e.target.checked })
              }
              className="h-5 w-5 accent-ink"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm font-medium">Шинэ бараа</span>
            <input
              type="checkbox"
              checked={flags.is_new_arrival}
              onChange={(e) =>
                setFlags({ ...flags, is_new_arrival: e.target.checked })
              }
              className="h-5 w-5 accent-ink"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm font-medium">Эрэлттэй бараа</span>
            <input
              type="checkbox"
              checked={flags.is_best_seller}
              onChange={(e) =>
                setFlags({ ...flags, is_best_seller: e.target.checked })
              }
              className="h-5 w-5 accent-ink"
            />
          </label>
          <div>
            <label className="label">Эрэмбэ</label>
            <input
              type="number"
              className="input"
              value={flags.sort_order}
              onChange={(e) =>
                setFlags({ ...flags, sort_order: Number(e.target.value) })
              }
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        {/* h) Footer buttons */}
        <div className="space-y-2">
          {product?.status === "published" ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit((v) => save(v, "keep"))}
              className="btn-neon w-full"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Хадгалах
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit((v) => save(v, "published"))}
              className="btn-neon w-full"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Нийтлэх
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit((v) => save(v, "draft"))}
            className="btn-outline w-full"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ноорог хадгалах
          </button>
        </div>
      </div>
    </form>
  );
}
