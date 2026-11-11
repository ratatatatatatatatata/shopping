"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/utils/format";
import { createRunway, type RunwayApi } from "./engine";
import "./runway.css";

export interface RunwayVariant {
  id: string;
  colorId: string;
  size: string;
  stock: number;
  price: number;
}
export interface RunwayColor {
  id: string;
  name: string;
  code: string;
  image: string | null;
}
export interface RunwayProduct {
  id: string;
  name: string;
  slug: string;
  vendor: string;
  image: string;
  price: number;
  compareAt: number | null;
  colors: RunwayColor[];
  variants: RunwayVariant[];
}
export interface RunwayPiece {
  num: number;
  pinX: number;
  pinY: number;
  isNew: boolean;
  product: RunwayProduct;
}
export interface RunwayLook {
  id: string;
  name: string;
  description: string | null;
  image: string;
  couponCode: string | null;
  discountPct: number;
  pieces: RunwayPiece[];
}

interface PieceState {
  open: boolean;
  colorId: string;
  variantId: string | null;
  touched: boolean;
  status: "idle" | "loading" | "added";
}

const two = (n: number) => String(n).padStart(2, "0");

function availableVariants(p: RunwayProduct) {
  return p.variants.filter((v) => v.stock > 0);
}
function defaultColor(p: RunwayProduct) {
  const firstAvail = availableVariants(p)[0];
  return firstAvail?.colorId ?? p.colors[0]?.id ?? "";
}
function firstVariantFor(p: RunwayProduct, colorId: string) {
  return p.variants.find((v) => v.colorId === colorId && v.stock > 0)?.id ?? null;
}

export function RunwayLooks({ looks }: { looks: RunwayLook[] }) {
  const n = looks.length;
  const N = n * Math.ceil(8 / n);
  const rootRef = useRef<HTMLElement>(null);
  const api = useRef<RunwayApi | null>(null);
  const listRefs = useRef<Record<string, HTMLUListElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const [active, setActive] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [ctaLoading, setCtaLoading] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [pieces, setPieces] = useState<Record<string, PieceState>>(() => {
    const init: Record<string, PieceState> = {};
    looks.forEach((l) =>
      l.pieces.forEach((pc) => {
        const colorId = defaultColor(pc.product);
        init[`${l.id}:${pc.num}`] = {
          open: false,
          colorId,
          variantId: firstVariantFor(pc.product, colorId),
          touched: false,
          status: "idle",
        };
      })
    );
    return init;
  });

  const addItem = useCart((s) => s.addItem);
  const closeCart = useCart((s) => s.close);

  /* ---------- engine ---------- */
  const revealCard = useCallback((lookId: string, num: number) => {
    const card = cardRefs.current[`${lookId}:${num}`];
    const list = listRefs.current[lookId];
    if (!card || !list) return;
    const behavior: ScrollBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    if (list.scrollWidth > list.clientWidth + 2) {
      list.scrollTo({ left: card.offsetLeft - list.offsetLeft - 20, behavior });
    } else if (list.scrollHeight > list.clientHeight + 2) {
      list.scrollTo({ top: card.offsetTop - list.offsetTop - 12, behavior });
    } else {
      const r = card.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight - 140)
        scrollBy({ top: r.top - 0.3 * innerHeight, behavior });
    }
  }, []);

  const activeRef = useRef(0);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !n) return;
    api.current = createRunway(
      root,
      n,
      looks.map((l) => l.name),
      {
        onIndex: (i) => {
          activeRef.current = i;
          setActive(i);
          setHot(null);
          setSheet(null);
        },
        onHot: (num, reveal) => {
          setHot(num);
          if (reveal && num != null) revealCard(looks[activeRef.current].id, num);
        },
      }
    );
    return () => {
      api.current?.destroy();
      api.current = null;
    };
    // looks come from the server; rebuild only when the set changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [looks.map((l) => l.id).join("|")]);

  useEffect(() => {
    const mq = matchMedia("(max-width: 749px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  function showToast(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function patch(key: string, p: Partial<PieceState>) {
    setPieces((prev) => ({ ...prev, [key]: { ...prev[key], ...p } }));
  }

  function togglePicker(look: RunwayLook, pc: RunwayPiece) {
    const key = `${look.id}:${pc.num}`;
    const st = pieces[key];
    if (st.status === "added") return;
    if (mobile) {
      setSheet(sheet === key ? null : key);
      return;
    }
    patch(key, { open: !st.open });
    if (!st.open) setTimeout(() => revealCard(look.id, pc.num), 30);
  }

  function addPieces(
    look: RunwayLook,
    list: RunwayPiece[],
    overrides: Record<string, string> = {}
  ) {
    for (const pc of list) {
      const key = `${look.id}:${pc.num}`;
      const variantId = overrides[key] ?? pieces[key].variantId;
      const v = pc.product.variants.find((x) => x.id === variantId);
      if (!v) throw new Error("Боломжтой размер сонгоно уу.");
      const color = pc.product.colors.find((c) => c.id === v.colorId);
      addItem({
        variantId: v.id,
        productId: pc.product.id,
        colorId: v.colorId,
        name: pc.product.name,
        slug: pc.product.slug,
        colorName: color?.name ?? "",
        colorCode: color?.code ?? "#000000",
        size: v.size,
        price: v.price,
        imageUrl: color?.image || pc.product.image,
        quantity: 1,
        stock: v.stock,
      });
    }
    closeCart(); // stay on the runway; the toast confirms
  }

  function confirmPiece(look: RunwayLook, pc: RunwayPiece) {
    const key = `${look.id}:${pc.num}`;
    patch(key, { status: "loading", touched: true });
    setMsg((m) => ({ ...m, [look.id]: "" }));
    setTimeout(() => {
      try {
        addPieces(look, [pc]);
        patch(key, { status: "added", open: false });
        setSheet(null);
        showToast("Сагсанд нэмэгдлээ");
        if (navigator.vibrate && !matchMedia("(prefers-reduced-motion: reduce)").matches)
          navigator.vibrate(12);
      } catch (err) {
        patch(key, { status: "idle" });
        setMsg((m) => ({
          ...m,
          [look.id]: err instanceof Error ? err.message : "Сагсанд нэмэхэд алдаа гарлаа. Дахин оролдоно уу.",
        }));
      }
    }, 350);
  }

  function addFullLook(look: RunwayLook) {
    const keyOf = (pc: RunwayPiece) => `${look.id}:${pc.num}`;
    const remaining = look.pieces.filter(
      (pc) => pieces[keyOf(pc)].status !== "added" && availableVariants(pc.product).length
    );
    if (!remaining.length || ctaLoading) return;
    setMsg((m) => ({ ...m, [look.id]: "" }));
    const ready = remaining.filter((pc) => {
      const st = pieces[keyOf(pc)];
      return (
        availableVariants(pc.product).length === 1 ||
        (st.touched && !!st.variantId)
      );
    });
    const pending = remaining.filter((pc) => !ready.includes(pc));

    if (ready.length) {
      // single-variant products: the one variant is the choice
      const overrides: Record<string, string> = {};
      ready.forEach((pc) => {
        const only = availableVariants(pc.product);
        if (only.length === 1) overrides[keyOf(pc)] = only[0].id;
      });
      setCtaLoading(look.id);
      ready.forEach((pc) => patch(keyOf(pc), { status: "loading" }));
      setTimeout(() => {
        try {
          addPieces(look, ready, overrides);
          ready.forEach((pc) => patch(keyOf(pc), { status: "added", open: false }));
          showToast(ready.length > 1 ? "Сет сагсанд нэмэгдлээ" : "Сагсанд нэмэгдлээ");
        } catch {
          ready.forEach((pc) => patch(keyOf(pc), { status: "idle" }));
          setMsg((m) => ({ ...m, [look.id]: "Сагсанд нэмэхэд алдаа гарлаа. Дахин оролдоно уу." }));
        } finally {
          setCtaLoading(null);
        }
      }, 450);
    }
    if (pending.length) {
      if (mobile) setSheet(keyOf(pending[0]));
      else {
        pending.forEach((pc) => patch(keyOf(pc), { open: true }));
        setTimeout(() => revealCard(look.id, pending[0].num), 30);
      }
      setMsg((m) => ({
        ...m,
        [look.id]: `Размер сонгоно уу: ${pending.map((pc) => pc.product.name).join(", ")}`,
      }));
    }
  }

  const totals = useMemo(
    () =>
      looks.map((l) => {
        const sum = l.pieces.reduce((s, pc) => s + pc.product.price, 0);
        const pct = l.couponCode ? Number(l.discountPct) || 0 : 0;
        return { sum, pct, bundle: Math.round(sum * (1 - pct / 100)) };
      }),
    [looks]
  );

  if (!n) {
    return (
      <div className="rw-empty">
        Одоогоор нийтлэгдсэн сет алга.{" "}
        <Link href="/shop" className="underline">
          Дэлгүүр үзэх
        </Link>
      </div>
    );
  }

  /* ---------- picker (inline on desktop, sheet on phones) ---------- */
  function renderPicker(look: RunwayLook, pc: RunwayPiece, inSheet = false) {
    const key = `${look.id}:${pc.num}`;
    const st = pieces[key];
    const p = pc.product;
    const sizes = p.variants.filter((v) => v.colorId === st.colorId);
    const chosen = p.variants.find((v) => v.id === st.variantId);
    const color = p.colors.find((c) => c.id === st.colorId);
    return (
      <div className="rw__picker" id={`Picker-${key}`}>
        {inSheet && (
          <div className="rw__picker-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={color?.image || p.image} alt="" />
            <div>
              <div className="rw__picker-title">{p.name}</div>
              <div className="rw__picker-price">{formatPrice(chosen?.price ?? p.price)}</div>
            </div>
            <button className="rw__picker-close" aria-label="Хаах" onClick={() => setSheet(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>
        )}
        {p.colors.length > 1 && (
          <fieldset className="rw__opt">
            <legend className="rw__opt-name">Өнгө: {color?.name}</legend>
            <div className="rw__opt-values">
              {p.colors.map((c) => {
                const any = p.variants.some((v) => v.colorId === c.id && v.stock > 0);
                return (
                  <label key={c.id} className={`rw__pill${any ? "" : " is-unavailable"}`}>
                    <input
                      type="radio"
                      name={`Color-${key}`}
                      checked={st.colorId === c.id}
                      disabled={!any}
                      onChange={() =>
                        patch(key, {
                          colorId: c.id,
                          variantId: firstVariantFor(p, c.id),
                          touched: true,
                        })
                      }
                    />
                    <span className="rw__pill-label">
                      <span className="rw__swatch" style={{ background: c.code }} />
                      {c.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
        <fieldset className="rw__opt">
          <legend className="rw__opt-name">Размер</legend>
          <div className="rw__opt-values">
            {sizes.map((v) => (
              <label key={v.id} className={`rw__pill${v.stock > 0 ? "" : " is-unavailable"}`}>
                <input
                  type="radio"
                  name={`Opt-${key}`}
                  checked={st.variantId === v.id}
                  disabled={v.stock <= 0}
                  onChange={() => patch(key, { variantId: v.id, touched: true })}
                />
                <span className="rw__pill-label">{v.size}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          className="rw__confirm"
          disabled={!chosen || chosen.stock <= 0}
          onClick={() => confirmPiece(look, pc)}
        >
          {chosen && chosen.stock > 0 ? "Сагсанд нэмэх" : "Дууссан"}
          <span className="rw__sr"> — {p.name}</span>
        </button>
      </div>
    );
  }

  const sheetLook = sheet ? looks.find((l) => sheet.startsWith(l.id + ":")) : null;
  const sheetPiece = sheetLook?.pieces.find((pc) => `${sheetLook.id}:${pc.num}` === sheet);

  return (
    <>
      <section
        ref={rootRef}
        className="rw rw--add-icon rw--popup rw--list"
        data-autoplay="true"
        data-speed="5000"
        data-blur="true"
        aria-label="Сет хувцас"
      >
        <div className="rw__sticky">
          <div className="rw__grid">
            <div className="rw__left">
              <div className="rw__head">
                <div className="rw__intro">
                  <h1 className="rw__title">Сет хувцас.</h1>
                  <p className="rw__sub">
                    {n} сет, толгойноос хөл хүртэл бүрдүүлсэн. Цэг дээр дарж хувцсыг нь харна уу.
                  </p>
                </div>
                <span className="rw__sr" aria-live="polite" aria-atomic="true" data-rw-live />
              </div>

              <div
                className="rw__stage"
                data-rw-stage
                tabIndex={0}
                role="region"
                aria-roledescription="carousel"
                aria-label="Сет хувцас — сумаар эсвэл чирж солино"
              >
                <div className="rw__actors" data-rw-actors>
                  {Array.from({ length: N }).map((_, a) => {
                    const look = looks[a % n];
                    return (
                      <div key={a} className="rw__model" data-rw-model data-index={a} aria-hidden="true">
                        <span className="rw__shadow" />
                        <div className="rw__figure">
                          <div className="rw__art">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={look.image}
                              alt={look.name}
                              loading={a < n ? "eager" : "lazy"}
                              decoding="async"
                              draggable={false}
                              data-model-image
                            />
                            <button
                              className="rw__hit"
                              data-rw-go={a % n}
                              aria-label={`Сет ${(a % n) + 1}: ${look.name}`}
                              tabIndex={-1}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rw__heroes" data-rw-heroes>
                  {looks.map((look, i) => (
                    <div
                      key={look.id}
                      className="rw__hero"
                      data-rw-hero
                      data-index={i}
                      data-name={look.name}
                      data-probe={look.image}
                      aria-hidden="true"
                    >
                      <div className="rw__morph">
                        <span className="rw__shadow" />
                        <div className="rw__figure">
                          <div className="rw__art">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={look.image}
                              alt={look.name}
                              loading="eager"
                              decoding="async"
                              draggable={false}
                              data-model-image
                            />
                            <button
                              className="rw__zoom"
                              data-rw-zoom
                              aria-label={`Сетийг үзэх: ${look.name}`}
                              tabIndex={-1}
                            />
                            <div className="rw__pins">
                              {look.pieces.map((pc) => (
                                <button
                                  key={pc.num}
                                  className="rw__pin"
                                  data-rw-pin={pc.num}
                                  data-tip={pc.product.name}
                                  style={
                                    {
                                      left: `${pc.pinX}%`,
                                      top: `${pc.pinY}%`,
                                      "--pi": pc.num,
                                    } as React.CSSProperties
                                  }
                                  aria-label={`${pc.num}: ${pc.product.name}`}
                                  tabIndex={-1}
                                >
                                  <span className="rw__pin-dot">{pc.num}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <span className="rw__sweep" />
                <span className="rw__cursor" data-rw-cursor>
                  <span className="rw__cursor-in">
                    <span className="rw__cursor-label rw__cursor-drag">Чирэх</span>
                    <span className="rw__cursor-label rw__cursor-view">Үзэх</span>
                  </span>
                </span>
                <span className="rw__walk">
                  <span className="rw__walk-line" />
                </span>
              </div>

              <div className="rw__controls">
                <button className="rw__icon" data-rw-prev aria-label="Өмнөх сет">
                  <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M25 7H1M7 1L1 7l6 6" />
                  </svg>
                </button>
                <div className="rw__ticks">
                  {looks.map((look, i) => (
                    <button
                      key={look.id}
                      className="rw__tick"
                      data-rw-tick={i}
                      aria-current="false"
                      aria-label={`Сет ${i + 1}: ${look.name}`}
                    >
                      <span className="rw__tick-bar" />
                      <span className="rw__tick-label">
                        {two(i + 1)}
                        <span className="rw__tick-name">{"  "}{look.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <button className="rw__icon rw__auto" data-rw-auto aria-pressed="false" aria-label="Автоматаар солих">
                  <svg className="rw__i-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 4.5v15l12.5-7.5z" />
                  </svg>
                  <svg className="rw__i-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" />
                  </svg>
                </button>
                <button className="rw__icon" data-rw-next aria-label="Дараагийн сет">
                  <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 7h24M19 1l6 6-6 6" />
                  </svg>
                </button>
              </div>

              <div className="rw__lb" data-rw-lb role="region" aria-label="Сетийг үзэх" aria-hidden="true">
                <div className="rw__lb-stage" data-rw-lb-stage />
                <div className="rw__lb-top">
                  <p className="rw__lb-cap">
                    <span className="rw__lb-kicker" data-rw-lb-kicker />
                    <span className="rw__lb-name" data-rw-lb-name />
                  </p>
                  <button className="rw__lb-close" data-rw-zoom-close aria-label="Хаах">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 5l14 14M19 5L5 19" />
                    </svg>
                  </button>
                </div>
                <p className="rw__lb-hint">Цэг дээр дарж хувцсыг харна уу</p>
              </div>
            </div>

            {/* ---------- panel ---------- */}
            <div
              className="rw__panel has-rule"
              onPointerEnter={(e) => e.pointerType === "mouse" && api.current?.setPanelHover(true)}
              onPointerLeave={(e) => e.pointerType === "mouse" && api.current?.setPanelHover(false)}
              onClickCapture={(e) => {
                if ((e.target as HTMLElement).closest("button, a, input, label")) api.current?.engage();
              }}
              onChange={() => api.current?.engage()}
            >
              <div className="rw__panel-inner">
                <div className="rw__panel-head">
                  <h2 className="rw__panel-title">Энэ сетэд</h2>
                  <span key={active} className="rw__label is-swap">
                    {looks[active].pieces.length} хувцас
                  </span>
                </div>
                {looks.map((look, i) => {
                  if (i !== active) return null;
                  const t = totals[i];
                  const keys = look.pieces.map((pc) => `${look.id}:${pc.num}`);
                  const complete =
                    keys.length >= 2 && keys.every((k) => pieces[k]?.status === "added");
                  return (
                    <div
                      key={look.id}
                      className={`rw__look-panel is-in${complete ? " is-complete" : ""}`}
                      data-rw-panel={i}
                    >
                      <div className="rw__mhead">
                        <span className="rw__mhead-title">{look.name}</span>
                        <span className="rw__label">{look.pieces.length} хувцас</span>
                      </div>
                      <ul
                        className="rw__items"
                        role="list"
                        ref={(el) => {
                          listRefs.current[look.id] = el;
                        }}
                      >
                        {look.pieces.map((pc) => {
                          const key = `${look.id}:${pc.num}`;
                          const st = pieces[key];
                          const p = pc.product;
                          const cls = [
                            "rw__item",
                            hot === pc.num && "is-hot",
                            st.open && !mobile && "is-picking",
                            sheet === key && "is-picking",
                            st.status === "loading" && "is-loading",
                            st.status === "added" && "is-added",
                          ]
                            .filter(Boolean)
                            .join(" ");
                          return (
                            <li
                              key={pc.num}
                              ref={(el) => {
                                cardRefs.current[key] = el;
                              }}
                              className={cls}
                              style={{ "--i": pc.num } as React.CSSProperties}
                              onPointerEnter={(e) => e.pointerType === "mouse" && api.current?.hot(pc.num)}
                              onPointerLeave={(e) => e.pointerType === "mouse" && api.current?.hot(null)}
                            >
                              {pc.isNew && (
                                <span className="rw__tag">
                                  <span className="rw__tag-text">Шинэ</span>
                                </span>
                              )}
                              <Link
                                href={`/product/${p.slug}`}
                                className="rw__media"
                                tabIndex={-1}
                                aria-hidden="true"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.image} alt="" loading="lazy" decoding="async" />
                                <span className="rw__num">{pc.num}</span>
                              </Link>
                              <div className="rw__info">
                                <span className="rw__type">{p.vendor}</span>
                                <Link href={`/product/${p.slug}`} className="rw__name">
                                  {p.name}
                                </Link>
                                <span className="rw__price">
                                  {p.compareAt && p.compareAt > p.price && (
                                    <s>{formatPrice(p.compareAt)}</s>
                                  )}
                                  <span>{formatPrice(p.price)}</span>
                                </span>
                              </div>
                              <button
                                type="button"
                                className="rw__add"
                                aria-expanded={st.status === "added" ? undefined : st.open || sheet === key}
                                aria-controls={`Picker-${key}`}
                                aria-label={
                                  st.status === "added"
                                    ? `Сагсанд нэмэгдсэн: ${p.name}`
                                    : `Сагсанд нэмэх: ${p.name}`
                                }
                                disabled={!availableVariants(p).length}
                                onClick={() => togglePicker(look, pc)}
                              >
                                <svg className="rw__i-plus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                                  <path d="M12 4v16M4 12h16" />
                                </svg>
                                <svg className="rw__i-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M4.5 12.5l5 5L19.5 7" />
                                </svg>
                                <svg className="rw__i-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M12 3a9 9 0 1 1-9 9" />
                                </svg>
                              </button>
                              {st.open && !mobile && st.status !== "added" &&
                                renderPicker(look, pc)}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="rw__bundle has-rule">
                        {msg[look.id] && (
                          <p className="rw__msg" role="status" aria-live="polite">
                            {msg[look.id]}
                          </p>
                        )}
                        <div className="rw__bundle-row">
                          <div className="rw__bundle-copy">
                            <span className="rw__bundle-title">Сетийг бүтнээр нь</span>
                            <span className="rw__bundle-note">
                              {t.pct > 0 && look.couponCode
                                ? `«${look.couponCode}» купоноор ${t.pct}% хямд`
                                : `${look.pieces.length} хувцасны нийт үнэ`}
                            </span>
                          </div>
                          <div className="rw__bundle-price">
                            {t.pct > 0 && <s>{formatPrice(t.sum)}</s>}
                            <strong>{formatPrice(t.bundle)}</strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`rw__cta${ctaLoading === look.id ? " is-loading" : ""}`}
                          disabled={ctaLoading === look.id}
                          onClick={() => !complete && addFullLook(look)}
                        >
                          {complete ? (
                            <span className="rw__cta-done">Сет таны сагсанд</span>
                          ) : (
                            <>
                              <span className="rw__cta-add">Сетийг бүтнээр нь сагслах</span>
                              <span className="rw__cta-m">Бүтэн сет — {formatPrice(t.bundle)}</span>
                              <svg className="rw__cta-arrow" width="22" height="12" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 7h24M19 1l6 6-6 6" />
                              </svg>
                              <svg className="rw__i-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M12 3a9 9 0 1 1-9 9" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {mounted &&
        createPortal(
          <>
            {sheet && sheetLook && sheetPiece && (
              <>
                <button
                  className="rw-sheet-scrim"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setSheet(null)}
                />
                <div className="rw-sheet" role="dialog" aria-label={sheetPiece.product.name}>
                  {renderPicker(sheetLook, sheetPiece, true)}
                </div>
              </>
            )}
            <div className={`rw-toast${toast ? " is-on" : ""}`} role="status" aria-live="polite">
              {toast}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
