"use client";

import { useEffect, useState } from "react";
import { Crosshair, Loader2, Save, Type, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { revalidateStorefront } from "@/lib/actions/revalidate";
import { logAdminAction } from "@/lib/actions/adminLog";
import { cn } from "@/utils/format";

interface ImgField {
  url: string;
  file?: File;
  preview?: string;
}

interface Draft {
  is_visible: boolean;
  title: string;
  subtitle: string;
  link_url: string;
  tagline: string;
  word: string;
  card_text: string;
  card_button: string;
  scene: ImgField;
  garment: ImgField;
  card: ImgField;
  land_x: number;
  land_y: number;
  text_x: number;
  text_y: number;
  land_size: number;
}

const EMPTY: Draft = {
  is_visible: true,
  title: "",
  subtitle: "",
  link_url: "",
  tagline: "",
  word: "",
  card_text: "",
  card_button: "",
  scene: { url: "" },
  garment: { url: "" },
  card: { url: "" },
  land_x: 0.5,
  land_y: 0.64,
  text_x: 0.5,
  text_y: 0.14,
  land_size: 0.34,
};

const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown, d: number) => {
  const x = Number(v);
  return v === "" || v == null || !Number.isFinite(x) ? d : x;
};

function ImagePick({
  label,
  hint,
  value,
  onChange,
  dark,
}: {
  label: string;
  hint: string;
  value: ImgField;
  onChange: (v: ImgField) => void;
  dark?: boolean;
}) {
  const src = value.preview || value.url;
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <label
          className={cn(
            "relative grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-ink/15",
            dark ? "bg-[#0d1650]" : "bg-smoke"
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-contain" />
          ) : (
            <Upload className="h-5 w-5 text-neutral-400" />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange({ ...value, file, preview: URL.createObjectURL(file) });
            }}
          />
        </label>
        <div className="space-y-2 text-xs text-neutral-500">
          <p>{hint}</p>
          {src && (
            <button
              type="button"
              onClick={() => onChange({ url: "" })}
              className="inline-flex items-center gap-1 font-medium text-red-500"
            >
              <X className="h-3 w-3" /> Арилгах (анхны утга руу)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Admin editor for the homepage balloon-drop section (homepage_sections.key = "drop"). */
export function DropSectionEditor() {
  const [d, setD] = useState<Draft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<"land" | "text">("land");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("key", "drop")
        .maybeSingle();
      if (data) {
        const c = (data.content ?? {}) as Record<string, unknown>;
        setD({
          is_visible: data.is_visible,
          title: s(data.title),
          subtitle: s(data.subtitle),
          link_url: s(data.link_url),
          tagline: s(c.tagline),
          word: s(c.word),
          card_text: s(c.card_text),
          card_button: s(c.card_button),
          scene: { url: s(data.image_url) },
          garment: { url: s(c.garment_url) },
          card: { url: s(c.card_image_url) },
          land_x: n(c.land_x, 0.5),
          land_y: n(c.land_y, 0.64),
          text_x: n(c.text_x, 0.5),
          text_y: n(c.text_y, 0.14),
          land_size: n(c.land_size, 0.34),
        });
      }
      setLoading(false);
    })();
  }, []);

  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const up = async (f: ImgField) =>
        f.file ? await uploadImage(f.file, "brand-assets") : f.url;
      const [sceneUrl, garmentUrl, cardUrl] = await Promise.all([
        up(d.scene),
        up(d.garment),
        up(d.card),
      ]);
      const supabase = createClient();
      const { error } = await supabase.from("homepage_sections").upsert(
        {
          key: "drop",
          title: d.title.trim() || null,
          subtitle: d.subtitle.trim() || null,
          link_url: d.link_url.trim() || null,
          image_url: sceneUrl || null,
          is_visible: d.is_visible,
          sort_order: 3,
          content: {
            tagline: d.tagline,
            word: d.word.trim(),
            card_text: d.card_text,
            card_button: d.card_button.trim(),
            garment_url: garmentUrl || null,
            card_image_url: cardUrl || null,
            land_x: d.land_x,
            land_y: d.land_y,
            text_x: d.text_x,
            text_y: d.text_y,
            land_size: d.land_size,
          },
        },
        { onConflict: "key" }
      );
      if (error) throw error;
      set({
        scene: { url: sceneUrl },
        garment: { url: garmentUrl },
        card: { url: cardUrl },
      });
      await revalidateStorefront();
      await logAdminAction("content.section", "homepage_sections", "drop");
      setMsg("Хадгалагдлаа.");
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      alert(
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

  if (loading) return null;

  const sceneSrc = d.scene.preview || d.scene.url;
  const garmentSrc = d.garment.preview || d.garment.url;

  function pick(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000;
    if (mode === "land") set({ land_x: x, land_y: y });
    else set({ text_x: x, text_y: y });
  }

  return (
    <div className="card space-y-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Бөмбөлөгтэй унадаг хэсэг</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Хувцас бөмбөлөгт өлгөөтэй байж, доош гүйлгэхэд унаад дэлгүүрийн
            тавцан дээр буудаг хэсэг. Хоосон талбарт анхны утга ашиглагдана.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-neutral-500">
          Харагдана
          <input
            type="checkbox"
            checked={d.is_visible}
            onChange={(e) => set({ is_visible: e.target.checked })}
            className="h-4 w-4 accent-ink"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Тэнгэр дээрх бичиг</label>
          <textarea
            className="input min-h-[60px] !py-2"
            value={d.tagline}
            onChange={(e) => set({ tagline: e.target.value })}
            placeholder={"Шинэ үеийн\nстиль"}
          />
        </div>
        <div>
          <label className="label">Том үг (доод буланд)</label>
          <input
            className="input !py-2"
            value={d.word}
            onChange={(e) => set({ word: e.target.value })}
            placeholder="orasuits"
          />
        </div>
        <div>
          <label className="label">Картын бичиг</label>
          <textarea
            className="input min-h-[60px] !py-2"
            value={d.card_text}
            onChange={(e) => set({ card_text: e.target.value })}
            placeholder={"Энгийн байдлыг сонго.\nШинэ коллекц\nOrasuits-д ирлээ."}
          />
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Картын товч</label>
            <input
              className="input !py-2"
              value={d.card_button}
              onChange={(e) => set({ card_button: e.target.value })}
              placeholder="Шинэ коллекц үзэх"
            />
          </div>
          <div>
            <label className="label">Товчны холбоос</label>
            <input
              className="input !py-2"
              value={d.link_url}
              onChange={(e) => set({ link_url: e.target.value })}
              placeholder="/new-arrivals"
            />
          </div>
        </div>
        <div>
          <label className="label">Буусны дараах гарчиг</label>
          <input
            className="input !py-2"
            value={d.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Таны өдөр бүрийн стиль. Таны хэмжээнд."
          />
        </div>
        <div>
          <label className="label">Буусны дараах тайлбар</label>
          <textarea
            className="input min-h-[60px] !py-2"
            value={d.subtitle}
            onChange={(e) => set({ subtitle: e.target.value })}
            placeholder="Шинэ коллекц нэг дороос — өмсөхөд бэлэн, тохирох размертай."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePick
          label="Унах хувцас"
          hint="Арын фонгүй PNG/WebP, дээд талдаа өлгүүрийн дэгээтэй. Хоосон бол өлгүүрийн эхний бараа."
          value={d.garment}
          onChange={(garment) => set({ garment })}
          dark
        />
        <ImagePick
          label="Картын зураг"
          hint="Баруун талын картанд гарна. Картын өнгө зургийн зүүн дээд булангаас автоматаар авагдана."
          value={d.card}
          onChange={(card) => set({ card })}
        />
      </div>

      <div className="space-y-3">
        <ImagePick
          label="Буух газрын зураг (дэлгүүрийн дотор)"
          hint="Хэвтээ, өргөн зураг (жишээ нь 2688×1520). Хоосон бол энгийн дэлгүүрийн дүрслэл зурагдана."
          value={d.scene}
          onChange={(scene) => set({ scene })}
        />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-500">Зурган дээр дарж тохируулах:</span>
          <button
            type="button"
            onClick={() => setMode("land")}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium",
              mode === "land" ? "border-ink bg-ink text-white" : "border-ink/15"
            )}
          >
            <Crosshair className="h-3 w-3" /> Хувцас буух цэг
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium",
              mode === "text" ? "border-ink bg-ink text-white" : "border-ink/15"
            )}
          >
            <Type className="h-3 w-3" /> Гарчгийн байрлал
          </button>
        </div>
        <div
          onClick={pick}
          className={cn(
            "relative w-full cursor-crosshair overflow-hidden rounded-xl bg-[#efe9de]",
            !sceneSrc && "aspect-[1.55]"
          )}
        >
          {sceneSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sceneSrc} alt="" className="pointer-events-none block h-auto w-full" />
          ) : (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-0 bottom-0 h-[22%] bg-[#c8b89f]" />
              <div className="absolute bottom-[14%] left-1/2 h-[22%] w-[22%] -translate-x-1/2 rounded-md bg-[#f3ede2] shadow-lg" />
            </div>
          )}
          {/* landed garment preview */}
          <div
            className="pointer-events-none absolute -translate-x-1/2 bg-contain bg-top bg-no-repeat"
            style={{
              left: `${d.land_x * 100}%`,
              top: `${(d.land_y - d.land_size * 0.96) * 100}%`,
              height: `${d.land_size * 100}%`,
              aspectRatio: "1",
              backgroundImage: garmentSrc ? `url("${garmentSrc}")` : undefined,
              outline: garmentSrc ? undefined : "1px dashed #16193a55",
            }}
          />
          <span
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon ring-2 ring-ink"
            style={{ left: `${d.land_x * 100}%`, top: `${d.land_y * 100}%` }}
          />
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-ink"
            style={{ left: `${d.text_x * 100}%`, top: `${d.text_y * 100}%` }}
          >
            {d.title || "Гарчиг"}
          </span>
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label">
              Буусан хувцасны хэмжээ — {Math.round(d.land_size * 100)}%
            </label>
            <input
              type="range"
              min={0.12}
              max={0.6}
              step={0.01}
              value={d.land_size}
              onChange={(e) => set({ land_size: Number(e.target.value) })}
              className="w-full accent-ink"
            />
          </div>
          <p className="text-[11px] text-neutral-400">
            Цэг: {d.land_x.toFixed(2)} / {d.land_y.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-neon !py-2 text-xs">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Хадгалах
        </button>
        {msg && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
