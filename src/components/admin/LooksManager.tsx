"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Crosshair,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { revalidateStorefront } from "@/lib/actions/revalidate";
import { logAdminAction } from "@/lib/actions/adminLog";
import { cn } from "@/utils/format";
import type { Look } from "@/types";
import type { LookProductOption } from "@/app/admin/(panel)/looks/page";

interface ItemDraft {
  _key: string;
  product_id: string;
  pin_x: number;
  pin_y: number;
  is_new: boolean;
}

interface LookDraft {
  id?: string;
  name: string;
  description: string;
  model_image_url: string;
  file?: File;
  previewUrl?: string;
  coupon_code: string;
  discount_pct: number;
  sort_order: number;
  is_visible: boolean;
  items: ItemDraft[];
}

const keyGen = () => Math.random().toString(36).slice(2, 10);

function toDraft(look?: Look, nextSort = 0): LookDraft {
  return {
    id: look?.id,
    name: look?.name ?? "",
    description: look?.description ?? "",
    model_image_url: look?.model_image_url ?? "",
    coupon_code: look?.coupon_code ?? "",
    discount_pct: Number(look?.discount_pct ?? 0),
    sort_order: look?.sort_order ?? nextSort,
    is_visible: look?.is_visible ?? true,
    items: [...(look?.look_items ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it) => ({
        _key: it.id,
        product_id: it.product_id,
        pin_x: Number(it.pin_x),
        pin_y: Number(it.pin_y),
        is_new: it.is_new,
      })),
  };
}

const DEFAULT_PINS = [
  { x: 50, y: 28 },
  { x: 48, y: 58 },
  { x: 45, y: 88 },
  { x: 55, y: 42 },
  { x: 52, y: 72 },
];

export function LooksManager({
  looks,
  products,
}: {
  looks: Look[];
  products: LookProductOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | "new" | null>(
    looks[0]?.id ?? null
  );
  const [draft, setDraft] = useState<LookDraft | null>(
    looks[0] ? toDraft(looks[0]) : null
  );
  const [placing, setPlacing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const dragKey = useRef<string | null>(null);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [filter, products]);

  function select(id: string | "new") {
    setSelected(id);
    setError(null);
    setPlacing(null);
    if (id === "new") setDraft(toDraft(undefined, looks.length));
    else setDraft(toDraft(looks.find((l) => l.id === id)));
  }

  function update(patch: Partial<LookDraft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }
  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setDraft((d) =>
      d
        ? { ...d, items: d.items.map((it) => (it._key === key ? { ...it, ...patch } : it)) }
        : d
    );
  }
  function addItem(productId: string) {
    if (!draft || !productId) return;
    const pos = DEFAULT_PINS[draft.items.length % DEFAULT_PINS.length];
    const key = keyGen();
    update({
      items: [
        ...draft.items,
        { _key: key, product_id: productId, pin_x: pos.x, pin_y: pos.y, is_new: false },
      ],
    });
    setPlacing(key);
  }
  function removeItem(key: string) {
    if (!draft) return;
    update({ items: draft.items.filter((it) => it._key !== key) });
    if (placing === key) setPlacing(null);
  }
  function moveItem(key: string, dir: -1 | 1) {
    if (!draft) return;
    const i = draft.items.findIndex((it) => it._key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= draft.items.length) return;
    const items = [...draft.items];
    [items[i], items[j]] = [items[j], items[i]];
    update({ items });
  }

  function pointToPin(clientX: number, clientY: number) {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return null;
    const x = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    return { pin_x: Math.round(x * 100) / 100, pin_y: Math.round(y * 100) / 100 };
  }

  async function save() {
    if (!draft) return;
    setError(null);
    if (!draft.name.trim()) return setError("Сетийн нэрийг оруулна уу.");
    if (!draft.model_image_url && !draft.file)
      return setError("Загварын зургийг оруулна уу.");
    if (!draft.items.length) return setError("Дор хаяж нэг бараа нэмнэ үү.");
    if (draft.discount_pct > 0 && !draft.coupon_code.trim())
      return setError(
        "Хямдралын хувь оруулсан бол купон код заавал бичнэ үү (Купон цэсэнд үүсгэсэн код)."
      );

    setSaving(true);
    const supabase = createClient();
    try {
      let imageUrl = draft.model_image_url;
      if (draft.file) imageUrl = await uploadImage(draft.file, "product-images");

      const row = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        model_image_url: imageUrl,
        coupon_code: draft.coupon_code.trim().toUpperCase() || null,
        discount_pct: Number(draft.discount_pct) || 0,
        sort_order: Number(draft.sort_order) || 0,
        is_visible: draft.is_visible,
      };

      let lookId = draft.id;
      if (lookId) {
        const { error: err } = await supabase.from("looks").update(row).eq("id", lookId);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase
          .from("looks")
          .insert(row)
          .select("id")
          .single();
        if (err) throw err;
        lookId = data.id as string;
      }

      const { error: delErr } = await supabase
        .from("look_items")
        .delete()
        .eq("look_id", lookId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("look_items").insert(
        draft.items.map((it, i) => ({
          look_id: lookId,
          product_id: it.product_id,
          pin_x: it.pin_x,
          pin_y: it.pin_y,
          is_new: it.is_new,
          sort_order: i,
        }))
      );
      if (insErr) throw insErr;

      await revalidateStorefront();
      await logAdminAction(draft.id ? "look.update" : "look.create", "looks", lookId, {
        name: row.name,
      });
      setSelected(lookId);
      setDraft((d) =>
        d ? { ...d, id: lookId, model_image_url: imageUrl, file: undefined, previewUrl: undefined } : d
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Хадгалахад алдаа гарлаа."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!draft?.id) return;
    if (!confirm(`"${draft.name}" сетийг устгах уу? Бараанууд өөрөө устахгүй.`)) return;
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("looks").delete().eq("id", draft.id);
    setSaving(false);
    if (err) return setError(err.message);
    await revalidateStorefront();
    await logAdminAction("look.delete", "looks", draft.id, { name: draft.name });
    setSelected(null);
    setDraft(null);
    router.refresh();
  }

  async function toggleVisible(look: Look) {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("looks")
      .update({ is_visible: !look.is_visible })
      .eq("id", look.id);
    if (err) return alert(err.message);
    await revalidateStorefront();
    router.refresh();
    if (draft?.id === look.id) update({ is_visible: !look.is_visible });
  }

  const image = draft?.previewUrl || draft?.model_image_url;

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      {/* ---------- list ---------- */}
      <div className="space-y-3">
        <button onClick={() => select("new")} className="btn-neon w-full !py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Шинэ сет
        </button>
        {looks.length === 0 && (
          <p className="card p-5 text-center text-sm text-neutral-500">
            Одоогоор сет алга. «Шинэ сет» дээр дарж эхлээрэй.
          </p>
        )}
        {looks.map((look, i) => (
          <div
            key={look.id}
            className={cn(
              "card flex cursor-pointer items-center gap-3 p-3 transition-colors hover:border-ink/20",
              selected === look.id && "ring-2 ring-ink"
            )}
            onClick={() => select(look.id)}
          >
            <div className="h-20 w-12 shrink-0 overflow-hidden rounded-lg bg-smoke">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={look.model_image_url} alt="" className="h-full w-full object-contain object-bottom" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Сет {String(i + 1).padStart(2, "0")}
              </p>
              <p className="truncate text-sm font-semibold">{look.name}</p>
              <p className="text-xs text-neutral-500">
                {look.look_items?.length ?? 0} бараа
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleVisible(look);
              }}
              className="rounded-lg p-2 text-neutral-400 hover:bg-smoke hover:text-ink"
              title={look.is_visible ? "Нуух" : "Харуулах"}
            >
              {look.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>

      {/* ---------- editor ---------- */}
      {draft ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="card space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">
                {draft.id ? "Сет засах" : "Шинэ сет"}
              </h2>
              <div>
                <label className="label">Сетийн нэр</label>
                <input
                  className="input"
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Хотын өдөр"
                />
              </div>
              <div>
                <label className="label">Тайлбар (заавал биш)</label>
                <textarea
                  className="input min-h-[70px]"
                  value={draft.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="Саарал сүлжмэл, тайван жинс."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Купон код</label>
                  <input
                    className="input uppercase"
                    value={draft.coupon_code}
                    onChange={(e) => update({ coupon_code: e.target.value })}
                    placeholder="SET10"
                  />
                </div>
                <div>
                  <label className="label">Хямдрал (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    className="input"
                    value={draft.discount_pct}
                    onChange={(e) => update({ discount_pct: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Эрэмбэ</label>
                  <input
                    type="number"
                    className="input"
                    value={draft.sort_order}
                    onChange={(e) => update({ sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                Хямдрал зөвхөн харуулах зориулалттай. Бодитоор хямдруулах бол
                «Купон» цэсэнд ижил кодтой купон үүсгэнэ үү — хэрэглэгч захиалга
                өгөхдөө тэр кодыг оруулна.
              </p>
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm font-medium">Дэлгүүрт харагдана</span>
                <input
                  type="checkbox"
                  checked={draft.is_visible}
                  onChange={(e) => update({ is_visible: e.target.checked })}
                  className="h-5 w-5 accent-ink"
                />
              </label>
            </div>

            {/* items */}
            <div className="card space-y-4 p-6">
              <div>
                <h2 className="font-display text-lg font-bold">Сетийн бараанууд</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Бараа нэмээд, баруун талын зурган дээр дарж цэгийн байрлалыг
                  тохируулна. Цэгийг чирж бас зөөж болно.
                </p>
              </div>
              <ol className="space-y-2">
                {draft.items.map((it, i) => {
                  const p = productMap.get(it.product_id);
                  return (
                    <li
                      key={it._key}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-ink/10 p-2.5",
                        placing === it._key && "border-ink bg-smoke"
                      )}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">
                        {i + 1}
                      </span>
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-smoke">
                        {p?.main_image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.main_image_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p?.name ?? "Устгагдсан бараа"}</p>
                        <p className="text-[11px] text-neutral-400">
                          {p && p.status !== "published" ? "Ноорог — дэлгүүрт харагдахгүй · " : ""}
                          {it.pin_x.toFixed(0)}% / {it.pin_y.toFixed(0)}%
                        </p>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <input
                          type="checkbox"
                          checked={it.is_new}
                          onChange={(e) => updateItem(it._key, { is_new: e.target.checked })}
                          className="accent-ink"
                        />
                        Шинэ
                      </label>
                      <button
                        type="button"
                        title="Цэг байрлуулах"
                        onClick={() => setPlacing(placing === it._key ? null : it._key)}
                        className={cn(
                          "rounded-lg p-1.5 text-neutral-400 hover:bg-white hover:text-ink",
                          placing === it._key && "bg-ink text-white hover:bg-ink hover:text-white"
                        )}
                      >
                        <Crosshair className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => moveItem(it._key, -1)} className="rounded-lg p-1.5 text-neutral-400 hover:text-ink" title="Дээш">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => moveItem(it._key, 1)} className="rounded-lg p-1.5 text-neutral-400 hover:text-ink" title="Доош">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeItem(it._key)} className="rounded-lg p-1.5 text-neutral-400 hover:text-red-500" title="Хасах">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                <input
                  className="input !py-2 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Бараа хайх..."
                />
                <select
                  className="input cursor-pointer !py-2 text-sm"
                  value=""
                  onChange={(e) => addItem(e.target.value)}
                >
                  <option value="">+ Бараа нэмэх ({filtered.length})</option>
                  {filtered.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.status !== "published" ? " (ноорог)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={save} disabled={saving} className="btn-neon">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Хадгалах
              </button>
              {draft.id && (
                <button onClick={remove} disabled={saving} className="btn-outline !text-red-600">
                  <Trash2 className="h-4 w-4" /> Устгах
                </button>
              )}
            </div>
          </div>

          {/* preview with pins */}
          <div className="space-y-3">
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Загварын зураг</h3>
                <label className="btn-outline cursor-pointer !px-3 !py-1.5 text-xs">
                  <Upload className="h-3.5 w-3.5" /> {image ? "Солих" : "Сонгох"}
                  <input
                    type="file"
                    accept="image/png,image/webp,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) update({ file, previewUrl: URL.createObjectURL(file) });
                    }}
                  />
                </label>
              </div>
              <div
                ref={boxRef}
                className={cn(
                  "relative mx-auto aspect-[9/16] w-full max-w-[300px] select-none overflow-hidden rounded-xl bg-white",
                  "bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%),linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]",
                  placing ? "cursor-crosshair" : "cursor-default"
                )}
                onClick={(e) => {
                  if (!placing || dragKey.current) return;
                  const pt = pointToPin(e.clientX, e.clientY);
                  if (pt) updateItem(placing, pt);
                }}
                onPointerMove={(e) => {
                  if (!dragKey.current) return;
                  const pt = pointToPin(e.clientX, e.clientY);
                  if (pt) updateItem(dragKey.current, pt);
                }}
                onPointerUp={() => {
                  setTimeout(() => (dragKey.current = null), 0);
                }}
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-center text-xs text-neutral-400">
                    <div>
                      <Upload className="mx-auto mb-2 h-6 w-6" />
                      Бүтэн биеийн, арын фонгүй
                      <br />
                      (PNG/WebP) зураг
                    </div>
                  </div>
                )}
                {draft.items.map((it, i) => (
                  <button
                    key={it._key}
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                      dragKey.current = it._key;
                      setPlacing(it._key);
                    }}
                    className={cn(
                      "absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full text-[11px] font-semibold shadow-lg ring-2 ring-white",
                      placing === it._key ? "bg-neon text-ink" : "bg-ink text-white"
                    )}
                    style={{ left: `${it.pin_x}%`, top: `${it.pin_y}%` }}
                    title={productMap.get(it.product_id)?.name}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
                Дэлгүүрт загвар 9:16 хайрцагт, доод талаараа тэгшлэгдэж
                харагдана. Арын фонгүй зураг хамгийн гоё харагдана.
                {placing && " Одоо зурган дээр дарж сонгосон барааны цэгийг байрлуулна уу."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card grid place-items-center p-16 text-sm text-neutral-500">
          Сет сонгох эсвэл шинээр үүсгэнэ үү.
        </div>
      )}
    </div>
  );
}
