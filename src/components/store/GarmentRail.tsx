"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { blackletter, cormorant, instrumentSerif } from "@/lib/fonts";
import "./garment-rail.css";

export interface RailItem {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string;
}

const SLOT = 108;
const OPEN = 86;
const CX = 750;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const MOBILE = 768;

const two = (n: number) => String(n).padStart(2, "0");

/**
 * Homepage hero: a chrome clothing rail with up to ten garments hanging
 * edge-on in CSS 3D. Hover (or swipe on phones) swings one round to face
 * the viewer; clicking lifts it into a centred detail view.
 */
export function GarmentRail({
  items: allItems,
  marquee,
  brand = "Orasuits",
}: {
  items: RailItem[];
  marquee: string[];
  brand?: string;
}) {
  const items = allItems.slice(0, 10);
  const rootRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !items.length) return;
    const $ = <T extends HTMLElement>(sel: string) =>
      root.querySelector(sel) as T;

    const art = $<HTMLDivElement>(".gr-art");
    const rack = $<HTMLDivElement>(".gr-rack");
    const cap = $<HTMLDivElement>(".gr-cap");
    const capName = cap.querySelector("b") as HTMLElement;
    const capPrice = cap.querySelector("span") as HTMLElement;
    const big = $<HTMLDivElement>(".gr-big");
    const big2 = $<HTMLDivElement>(".gr-big2");
    const num = $<HTMLDivElement>(".gr-num");
    const nameEl = $<HTMLDivElement>(".gr-name");
    const priceEl = $<HTMLDivElement>(".gr-price");
    const more = $<HTMLAnchorElement>(".gr-more");
    const G = Array.from(root.querySelectorAll<HTMLDivElement>(".gr-g"));
    const N = G.length;

    let hov = -1;
    let open = -1;
    let k = 1;
    let mobile = false;
    let inView = false;
    let pointerType = "mouse";
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const paint = (el: HTMLElement, i: number) => {
      el.style.backgroundImage = `url("${items[i].image}")`;
    };
    G.forEach((g, i) => paint(g.querySelector("i") as HTMLElement, i));

    const baseX = (i: number) => CX + (i - (N - 1) / 2) * SLOT;
    const slotX = (i: number) =>
      baseX(i) + (hov >= 0 && i !== hov ? Math.sign(i - hov) * OPEN : 0);

    /* ---------- fit / camera ---------- */
    function place(animate: boolean) {
      const W = root!.clientWidth;
      const H = root!.clientHeight;
      // phones and tall/narrow screens: fill the height and pan instead
      mobile = W < MOBILE || W / H < 1.15;
      root!.classList.toggle("is-mobile", mobile);
      let tx: number;
      let ty: number;
      if (!mobile) {
        k = Math.min(W / 1500, H / 1000);
        tx = (W - 1500 * k) / 2;
        ty = (H - 1000 * k) / 2;
      } else {
        // Phones: scale by height and pan the camera to the faced garment.
        k = H / 1000;
        const cx = open >= 0 ? CX : hov >= 0 ? slotX(hov) : CX;
        tx = Math.min(0, Math.max(W - 1500 * k, W / 2 - cx * k));
        ty = 0;
      }
      art.classList.toggle("is-pan", mobile && animate);
      art.style.transform = `translate(${tx}px, ${ty}px) scale(${k})`;
    }

    /* ---------- rail layout ---------- */
    function layout() {
      G.forEach((g, i) => {
        g.style.left = slotX(i) + "px";
        g.classList.toggle("face", i === hov);
      });
      if (hov >= 0) {
        cap.style.left = G[hov].style.left;
        capName.textContent = items[hov].name;
        capPrice.textContent = items[hov].price;
        cap.classList.add("on");
      } else {
        cap.classList.remove("on");
      }
      if (mobile) place(true);
    }

    function fill(i: number) {
      num.textContent = `${two(i + 1)} / ${two(N)}`;
      nameEl.textContent = items[i].name;
      priceEl.textContent = items[i].price;
      more.href = `/product/${items[i].slug}`;
    }

    function openG(i: number) {
      if (open >= 0) return;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      open = i;
      hov = i;
      layout();
      const gx = parseFloat(G[i].style.left);
      big.getAnimations().forEach((a) => a.cancel());
      big.style.opacity = "";
      paint(big, i);
      fill(i);
      root!.classList.add("open");
      big.animate(
        [
          { transform: `translate(${gx - CX}px, -8px) scale(.61)`, opacity: 1 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 750, easing: EASE, fill: "forwards" }
      );
      G[i].style.visibility = "hidden";
    }

    function step(d: number) {
      if (open < 0) return;
      const from = open;
      open = (open + d + N) % N;
      fill(open);
      G[from].style.visibility = "";
      G[open].style.visibility = "hidden";
      hov = open;
      layout();
      paint(big2, from);
      big2.animate(
        [
          { transform: "none", opacity: 1, filter: "blur(0)" },
          {
            transform: `translateX(${-d * 120}px) scale(.94)`,
            opacity: 0,
            filter: "blur(6px)",
          },
        ],
        { duration: 600, easing: EASE }
      );
      big.getAnimations().forEach((a) => a.cancel());
      paint(big, open);
      big.animate(
        [
          {
            transform: `translateX(${d * 120}px) scale(.94)`,
            opacity: 0,
            filter: "blur(6px)",
          },
          { transform: "none", opacity: 1, filter: "blur(0)" },
        ],
        { duration: 600, easing: EASE, fill: "forwards" }
      );
    }

    function closeG() {
      if (open < 0) return;
      const i = open;
      const gx = parseFloat(G[i].style.left);
      big.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: `translate(${gx - CX}px, -8px) scale(.61)`, opacity: 1 },
        ],
        { duration: 650, easing: EASE, fill: "forwards" }
      );
      root!.classList.remove("open");
      closeTimer = setTimeout(() => {
        closeTimer = null;
        G[i].style.visibility = "";
        big.getAnimations().forEach((a) => a.cancel());
        big.style.opacity = "0";
        open = -1;
        hov = -1;
        layout();
      }, 650);
    }

    /* ---------- pointer ---------- */
    const onDown = (e: PointerEvent) => {
      pointerType = e.pointerType;
    };
    root.addEventListener("pointerdown", onDown, true);

    const enters = G.map((g, i) => {
      const onEnter = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || open >= 0) return;
        hov = i;
        layout();
      };
      const onClick = () => {
        if (open >= 0) return;
        // Touch: first tap faces the garment, second tap opens it.
        if (pointerType !== "mouse" && hov !== i) {
          hov = i;
          layout();
          return;
        }
        openG(i);
      };
      g.addEventListener("pointerenter", onEnter);
      g.addEventListener("click", onClick);
      return { g, onEnter, onClick };
    });

    const onRackLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || open >= 0) return;
      hov = -1;
      layout();
    };
    rack.addEventListener("pointerleave", onRackLeave);

    // Phones: horizontal swipe walks along the rail.
    let sx = 0;
    let sy = 0;
    let swiping = false;
    const onTouchStart = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      sx = e.clientX;
      sy = e.clientY;
      swiping = true;
    };
    const onTouchEnd = (e: PointerEvent) => {
      if (!swiping) return;
      swiping = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (open >= 0) step(dx < 0 ? 1 : -1);
      else {
        hov = dx < 0 ? Math.min(N - 1, hov + 1) : hov < 0 ? N - 1 : Math.max(0, hov - 1);
        layout();
      }
    };
    root.addEventListener("pointerdown", onTouchStart);
    root.addEventListener("pointerup", onTouchEnd);
    root.addEventListener("pointercancel", () => (swiping = false));

    /* ---------- detail controls ---------- */
    const prevBtn = $<HTMLButtonElement>(".gr-prev");
    const nextBtn = $<HTMLButtonElement>(".gr-next");
    const closeBtn = $<HTMLButtonElement>(".gr-close");
    const hit = $<HTMLDivElement>(".gr-det .hit");
    const onPrev = () => step(-1);
    const onNext = () => step(1);
    prevBtn.addEventListener("click", onPrev);
    nextBtn.addEventListener("click", onNext);
    closeBtn.addEventListener("click", closeG);
    hit.addEventListener("click", closeG);
    const onMore = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      routerRef.current.push(more.getAttribute("href") || "/shop");
    };
    more.addEventListener("click", onMore);

    /* ---------- keyboard (only while the rail is on screen) ---------- */
    const io = new IntersectionObserver(
      ([entry]) => (inView = entry.intersectionRatio > 0.5),
      { threshold: [0, 0.5, 1] }
    );
    io.observe(root);
    const onKey = (e: KeyboardEvent) => {
      if (!inView) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (open < 0) {
        if (e.key === "ArrowRight") {
          hov = Math.min(N - 1, hov + 1);
          layout();
        } else if (e.key === "ArrowLeft") {
          hov = hov < 0 ? N - 1 : Math.max(0, hov - 1);
          layout();
        } else if (e.key === "Enter" && hov >= 0) openG(hov);
      } else {
        if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
        else if (e.key === "Escape") closeG();
      }
    };
    window.addEventListener("keydown", onKey);

    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    place(false);
    layout();

    (window as unknown as { __closet: unknown }).__closet = {
      openG,
      step,
      closeG,
      setHov: (i: number) => {
        hov = i;
        layout();
      },
    };

    return () => {
      if (closeTimer) clearTimeout(closeTimer);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("pointerdown", onDown, true);
      root.removeEventListener("pointerdown", onTouchStart);
      root.removeEventListener("pointerup", onTouchEnd);
      rack.removeEventListener("pointerleave", onRackLeave);
      enters.forEach(({ g, onEnter, onClick }) => {
        g.removeEventListener("pointerenter", onEnter);
        g.removeEventListener("click", onClick);
      });
      prevBtn.removeEventListener("click", onPrev);
      nextBtn.removeEventListener("click", onNext);
      closeBtn.removeEventListener("click", closeG);
      hit.removeEventListener("click", closeG);
      more.removeEventListener("click", onMore);
    };
    // items are server data; re-run only when their identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id + i.image).join("|")]);

  const words = marquee.filter(Boolean);
  const track = Array.from({ length: 16 }).flatMap((_, r) =>
    words.flatMap((w, j) => [
      <span key={`${r}-${j}-w`}>{w}</span>,
      <span key={`${r}-${j}-b`}>•</span>,
    ])
  );

  return (
    <section
      ref={rootRef}
      aria-label="Онцлох хувцас"
      className={`gr ${blackletter.variable} ${instrumentSerif.variable} ${cormorant.variable}`}
    >
      <div className="gr-art">
        <Link href="/about" className="gr-about ui dim">
          Бидний тухай
        </Link>
        <div className="gr-logo dim">{brand}</div>
        <Link href="/contact" className="gr-contact ui dim dimmer">
          Холбоо барих
        </Link>
        <div className="gr-rail dim" />
        <div className="gr-rack dim">
          {items.map((it) => (
            <div
              key={it.id}
              className="gr-g"
              role="button"
              tabIndex={-1}
              aria-label={`${it.name} — ${it.price}`}
            >
              <i />
            </div>
          ))}
        </div>
        <div className="gr-cap dimmer" aria-hidden="true">
          <b />
          <span />
        </div>
        <Link href="/shop" className="gr-avail pill ui dim dimmer">
          Бүх барааг үзэх
        </Link>
        <div className="gr-band dimmer" aria-hidden="true">
          <div className="gr-track">{track}</div>
        </div>
        <div className="gr-det">
          <div className="hit" />
          <div className="gr-big2" />
          <div className="gr-big" />
          <button className="arr gr-prev" aria-label="Өмнөх">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 5L8 12L15 19" />
            </svg>
          </button>
          <button className="arr gr-next" aria-label="Дараах">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 5L16 12L9 19" />
            </svg>
          </button>
          <div className="gr-info">
            <div className="gr-num" />
            <div className="gr-name" />
            <div className="gr-price" />
            <a className="gr-more pill ui" href="/shop">
              Дэлгэрэнгүй үзэх
            </a>
          </div>
          <button className="gr-close ui">Хаах</button>
        </div>
      </div>
    </section>
  );
}
