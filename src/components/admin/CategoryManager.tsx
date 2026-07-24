"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { revalidateStorefront } from "@/lib/actions/revalidate";
import { logAdminAction } from "@/lib/actions/adminLog";
import { slugify } from "@/utils/format";
import type { Category } from "@/types";

type CategoryRow = Category & { products?: { count: number }[] };

interface FormState {
  id?: string;
  name: string;
  parent_id: string;
  is_visible: boolean;
  sort_order: number;
  image_url: string;
  file?: File;
  previewUrl?: string;
}

const EMPTY: FormState = {
  name: "",
  parent_id: "",
  is_visible: true,
  sort_order: 0,
  image_url: "",
};

export function CategoryManager({
  categories,
}: {
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byId = new Map(categories.map((c) => [c.id, c]));

  function openCreate() {
    setForm(EMPTY);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setForm({
      id: c.id,
      name: c.name,
      parent_id: c.parent_id ?? "",
      is_visible: c.is_visible,
      sort_order: c.sort_order,
      image_url: c.image_url ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Нэр оруулна уу.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      let imageUrl = form.image_url;
      if (form.file) imageUrl = await uploadImage(form.file, "category-images");

      const data = {
        name: form.name.trim(),
        parent_id: form.parent_id || null,
        is_visible: form.is_visible,
        sort_order: Number(form.sort_order) || 0,
        image_url: imageUrl || null,
      };

      if (form.id) {
        const { error: err } = await supabase
          .from("categories")
          .update(data)
          .eq("id", form.id);
        if (err) throw err;
        await logAdminAction("category.update", "categories", form.id, {
          name: data.name,
        });
      } else {
        const { data: created, error: err } = await supabase
          .from("categories")
          .insert({ ...data, slug: slugify(form.name) })
          .select("id")
          .single();
        if (err) throw err;
        await logAdminAction("category.create", "categories", created.id, {
          name: data.name,
        });
      }
      await revalidateStorefront();
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisible(c: CategoryRow) {
    setRowLoading(c.id);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("categories")
      .update({ is_visible: !c.is_visible })
      .eq("id", c.id);
    if (!err) {
      await revalidateStorefront();
      await logAdminAction("category.toggle_visible", "categories", c.id, {
        name: c.name,
        is_visible: !c.is_visible,
      });
    }
    setRowLoading(null);
    router.refresh();
  }

  async function handleDelete(c: CategoryRow) {
    if (
      !confirm(
        `"${c.name}" ангиллыг устгах уу? Бараанууд ангилалгүй болно.`
      )
    )
      return;
    setRowLoading(c.id);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("categories")
      .delete()
      .eq("id", c.id);
    if (err) {
      alert("Устгахад алдаа гарлаа: " + err.message);
    } else {
      await revalidateStorefront();
      await logAdminAction("category.delete", "categories", c.id, {
        name: c.name,
      });
    }
    setRowLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-neon !py-2.5">
          <Plus className="h-4 w-4" /> Ангилал нэмэх
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Ангилал</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Эцэг ангилал</th>
              <th className="px-4 py-3 text-center">Бараа</th>
              <th className="px-4 py-3 text-center">Эрэмбэ</th>
              <th className="px-4 py-3 text-center">Харагдах</th>
              <th className="px-4 py-3 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {categories.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-neutral-400"
                >
                  Ангилал алга байна.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-smoke/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image_url ?? ""}
                      alt=""
                      className="h-11 w-11 rounded-lg bg-smoke object-cover"
                    />
                    <span className="font-semibold">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500">{c.slug}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {c.parent_id ? (byId.get(c.parent_id)?.name ?? "—") : "—"}
                </td>
                <td className="px-4 py-3 text-center text-neutral-500">
                  {c.products?.[0]?.count ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-neutral-500">
                  {c.sort_order}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleVisible(c)}
                    disabled={rowLoading === c.id}
                    className="rounded-full p-2 text-neutral-500 hover:bg-smoke"
                    title={c.is_visible ? "Нуух" : "Харуулах"}
                  >
                    {rowLoading === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : c.is_visible ? (
                      <Eye className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-neutral-400" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(c)}
                      className="rounded-full p-2 text-neutral-500 hover:bg-smoke"
                      title="Засах"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="rounded-full p-2 text-red-500 hover:bg-red-50"
                      title="Устгах"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 z-40 bg-ink/50"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              className="fixed inset-x-4 top-[8%] z-50 mx-auto max-h-[84vh] w-auto max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">
                  {form.id ? "Ангилал засах" : "Ангилал нэмэх"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-full p-2 hover:bg-smoke"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="label">Нэр *</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Цамц"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Эцэг ангилал</label>
                    <select
                      className="input"
                      value={form.parent_id}
                      onChange={(e) =>
                        setForm({ ...form, parent_id: e.target.value })
                      }
                    >
                      <option value="">— Байхгүй —</option>
                      {categories
                        .filter((c) => c.id !== form.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Эрэмбэ</label>
                    <input
                      type="number"
                      className="input"
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm({ ...form, sort_order: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Зураг</label>
                  <label className="group relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/15 bg-smoke">
                    {form.previewUrl || form.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.previewUrl || form.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-neutral-400">
                        <Upload className="mx-auto h-6 w-6" />
                        <p className="mt-1 text-xs">Зураг сонгох</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          setForm({
                            ...form,
                            file,
                            previewUrl: URL.createObjectURL(file),
                          });
                      }}
                    />
                  </label>
                </div>
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-sm font-medium">
                    Дэлгүүрт харагдана
                  </span>
                  <input
                    type="checkbox"
                    checked={form.is_visible}
                    onChange={(e) =>
                      setForm({ ...form, is_visible: e.target.checked })
                    }
                    className="h-5 w-5 accent-ink"
                  />
                </label>

                {error && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-neon w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Хадгалах
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
