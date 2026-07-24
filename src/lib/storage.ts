import { createClient } from "@/lib/supabase/client";

/** Uploads a file to Supabase Storage and returns its public URL. */
export async function uploadImage(
  file: File,
  bucket:
    | "product-images"
    | "category-images"
    | "brand-assets"
    | "product-models" = "product-images"
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error("Зураг хуулахад алдаа гарлаа: " + error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
