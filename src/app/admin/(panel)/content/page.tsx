"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { revalidateStorefront } from "@/lib/actions/revalidate";
import { logAdminAction } from "@/lib/actions/adminLog";
import type { HomepageSection } from "@/types";

const SECTION_LABELS: Record<string, string> = {
  hero: "Нүүр баннер (Hero)",
  promo: "Урамшуулал (Promo)",
  brand_story: "Брэндийн түүх (Brand story)",
};

interface SectionDraft {
  key: string;
  title: string;
  subtitle: string;
  link_url: string;
  is_visible: boolean;
  image_url: string;
  file?: File;
  previewUrl?: string;
  sort_order: number;
}

interface SettingsDraft {
  contact: { phone: string; email: string; address: string; hours: string };
  social: { instagram: string; facebook: string };
  delivery: {
    standard_fee: string;
    express_fee: string;
    free_over: string;
    info: string;
  };
  bank: { bank_name: string; account_number: string; account_holder: string };
  policies: {
    returns: string;
    shipping: string;
    privacy: string;
    terms: string;
  };
}

const EMPTY_SETTINGS: SettingsDraft = {
  contact: { phone: "", email: "", address: "", hours: "" },
  social: { instagram: "", facebook: "" },
  delivery: { standard_fee: "", express_fee: "", free_over: "", info: "" },
  bank: { bank_name: "", account_number: "", account_holder: "" },
  policies: { returns: "", shipping: "", privacy: "", terms: "" },
};

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

export default function AdminContentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [settings, setSettings] = useState<SettingsDraft>(EMPTY_SETTINGS);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [sectionsRes, settingsRes] = await Promise.all([
      supabase.from("homepage_sections").select("*").order("sort_order"),
      supabase.from("site_settings").select("*"),
    ]);

    const rows = (sectionsRes.data ?? []) as HomepageSection[];
    const keys = ["hero", "promo", "brand_story"];
    setSections(
      keys.map((key) => {
        const row = rows.find((r) => r.key === key);
        return {
          key,
          title: row?.title ?? "",
          subtitle: row?.subtitle ?? "",
          link_url: row?.link_url ?? "",
          is_visible: row?.is_visible ?? true,
          image_url: row?.image_url ?? "",
          sort_order: row?.sort_order ?? keys.indexOf(key),
        };
      })
    );

    const next: SettingsDraft = structuredClone(EMPTY_SETTINGS);
    for (const s of settingsRes.data ?? []) {
      const v = (s.value ?? {}) as Record<string, unknown>;
      if (s.key === "contact")
        next.contact = {
          phone: str(v.phone),
          email: str(v.email),
          address: str(v.address),
          hours: str(v.hours),
        };
      if (s.key === "social")
        next.social = { instagram: str(v.instagram), facebook: str(v.facebook) };
      if (s.key === "delivery")
        next.delivery = {
          standard_fee: str(v.standard_fee),
          express_fee: str(v.express_fee),
          free_over: str(v.free_over),
          info: str(v.info),
        };
      if (s.key === "bank")
        next.bank = {
          bank_name: str(v.bank_name),
          account_number: str(v.account_number),
          account_holder: str(v.account_holder),
        };
      if (s.key === "policies")
        next.policies = {
          returns: str(v.returns),
          shipping: str(v.shipping),
          privacy: str(v.privacy),
          terms: str(v.terms),
        };
    }
    setSettings(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  }

  function updateSection(i: number, patch: Partial<SectionDraft>) {
    setSections((prev) =>
      prev.map((s, j) => (j === i ? { ...s, ...patch } : s))
    );
  }

  async function saveSection(section: SectionDraft) {
    setSaving(`section-${section.key}`);
    const supabase = createClient();
    try {
      let imageUrl = section.image_url;
      if (section.file)
        imageUrl = await uploadImage(section.file, "brand-assets");

      const { error } = await supabase.from("homepage_sections").upsert(
        {
          key: section.key,
          title: section.title || null,
          subtitle: section.subtitle || null,
          link_url: section.link_url || null,
          is_visible: section.is_visible,
          image_url: imageUrl || null,
          sort_order: section.sort_order,
        },
        { onConflict: "key" }
      );
      if (error) throw error;

      await revalidateStorefront();
      await logAdminAction("content.section", "homepage_sections", section.key);
      flash("Хадгалагдлаа.");
      load();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа."
      );
    } finally {
      setSaving(null);
    }
  }

  async function saveSettings(key: keyof SettingsDraft) {
    setSaving(`settings-${key}`);
    const supabase = createClient();
    try {
      let value: Record<string, unknown> = settings[key];
      if (key === "delivery") {
        value = {
          standard_fee: Number(settings.delivery.standard_fee) || 0,
          express_fee: Number(settings.delivery.express_fee) || 0,
          free_over: Number(settings.delivery.free_over) || 0,
          info: settings.delivery.info,
        };
      }
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;

      await revalidateStorefront();
      await logAdminAction("content.settings", "site_settings", key);
      flash("Хадгалагдлаа.");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа."
      );
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Агуулга</h1>
        {message && (
          <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            {message}
          </span>
        )}
      </div>

      {/* (a) Homepage sections */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold">Нүүр хуудасны хэсгүүд</h2>
        {sections.map((s, i) => (
          <div key={s.key} className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                {SECTION_LABELS[s.key] ?? s.key}
              </h3>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-neutral-500">
                Харагдана
                <input
                  type="checkbox"
                  checked={s.is_visible}
                  onChange={(e) =>
                    updateSection(i, { is_visible: e.target.checked })
                  }
                  className="h-4 w-4 accent-ink"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <label className="group relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/15 bg-smoke">
                {s.previewUrl || s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.previewUrl || s.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Upload className="h-5 w-5 text-neutral-400" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      updateSection(i, {
                        file,
                        previewUrl: URL.createObjectURL(file),
                      });
                  }}
                />
              </label>
              <div className="space-y-3">
                <div>
                  <label className="label">Гарчиг</label>
                  <input
                    className="input !py-2"
                    value={s.title}
                    onChange={(e) => updateSection(i, { title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Дэд гарчиг</label>
                  <input
                    className="input !py-2"
                    value={s.subtitle}
                    onChange={(e) =>
                      updateSection(i, { subtitle: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Холбоос (URL)</label>
                  <input
                    className="input !py-2"
                    value={s.link_url}
                    onChange={(e) =>
                      updateSection(i, { link_url: e.target.value })
                    }
                    placeholder="/shop"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => saveSection(s)}
              disabled={saving !== null}
              className="btn-neon mt-4 !py-2 text-xs"
            >
              {saving === `section-${s.key}` ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Хадгалах
            </button>
          </div>
        ))}
      </section>

      {/* (b) Site settings */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold">Сайтын тохиргоо</h2>

        {/* Contact */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Холбоо барих</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Утас</label>
              <input
                className="input !py-2"
                value={settings.contact.phone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, phone: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="label">И-мэйл</label>
              <input
                className="input !py-2"
                value={settings.contact.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, email: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Хаяг</label>
              <input
                className="input !py-2"
                value={settings.contact.address}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, address: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Ажлын цаг</label>
              <input
                className="input !py-2"
                value={settings.contact.hours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, hours: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <button
            onClick={() => saveSettings("contact")}
            disabled={saving !== null}
            className="btn-neon mt-4 !py-2 text-xs"
          >
            {saving === "settings-contact" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Хадгалах
          </button>
        </div>

        {/* Social */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Сошиал холбоос</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Instagram</label>
              <input
                className="input !py-2"
                value={settings.social.instagram}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, instagram: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Facebook</label>
              <input
                className="input !py-2"
                value={settings.social.facebook}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, facebook: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <button
            onClick={() => saveSettings("social")}
            disabled={saving !== null}
            className="btn-neon mt-4 !py-2 text-xs"
          >
            {saving === "settings-social" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Хадгалах
          </button>
        </div>

        {/* Delivery */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Хүргэлт</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Энгийн хүргэлт (₮)</label>
              <input
                type="number"
                className="input !py-2"
                value={settings.delivery.standard_fee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    delivery: {
                      ...settings.delivery,
                      standard_fee: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Шуурхай хүргэлт (₮)</label>
              <input
                type="number"
                className="input !py-2"
                value={settings.delivery.express_fee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    delivery: {
                      ...settings.delivery,
                      express_fee: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Үнэгүй хүргэлтийн босго (₮)</label>
              <input
                type="number"
                className="input !py-2"
                value={settings.delivery.free_over}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    delivery: {
                      ...settings.delivery,
                      free_over: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Хүргэлтийн мэдээлэл</label>
            <textarea
              className="input min-h-[70px] text-xs"
              value={settings.delivery.info}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  delivery: { ...settings.delivery, info: e.target.value },
                })
              }
            />
          </div>
          <button
            onClick={() => saveSettings("delivery")}
            disabled={saving !== null}
            className="btn-neon mt-4 !py-2 text-xs"
          >
            {saving === "settings-delivery" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Хадгалах
          </button>
        </div>

        {/* Bank */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Банкны данс</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Банк</label>
              <input
                className="input !py-2"
                value={settings.bank.bank_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank: { ...settings.bank, bank_name: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Дансны дугаар</label>
              <input
                className="input !py-2"
                value={settings.bank.account_number}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank: { ...settings.bank, account_number: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Хүлээн авагч</label>
              <input
                className="input !py-2"
                value={settings.bank.account_holder}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bank: { ...settings.bank, account_holder: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <button
            onClick={() => saveSettings("bank")}
            disabled={saving !== null}
            className="btn-neon mt-4 !py-2 text-xs"
          >
            {saving === "settings-bank" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Хадгалах
          </button>
        </div>

        {/* Policies */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Нөхцөл, журам</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Буцаалтын нөхцөл</label>
              <textarea
                className="input min-h-[90px] text-xs"
                value={settings.policies.returns}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: {
                      ...settings.policies,
                      returns: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Хүргэлтийн нөхцөл</label>
              <textarea
                className="input min-h-[90px] text-xs"
                value={settings.policies.shipping}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: {
                      ...settings.policies,
                      shipping: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Нууцлалын бодлого</label>
              <textarea
                className="input min-h-[90px] text-xs"
                value={settings.policies.privacy}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: {
                      ...settings.policies,
                      privacy: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Үйлчилгээний нөхцөл</label>
              <textarea
                className="input min-h-[90px] text-xs"
                value={settings.policies.terms}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: { ...settings.policies, terms: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <button
            onClick={() => saveSettings("policies")}
            disabled={saving !== null}
            className="btn-neon mt-4 !py-2 text-xs"
          >
            {saving === "settings-policies" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Хадгалах
          </button>
        </div>
      </section>
    </div>
  );
}
