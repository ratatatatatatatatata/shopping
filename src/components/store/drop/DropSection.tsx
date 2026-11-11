"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { jost } from "@/lib/fonts";
import "./drop.css";

/* Atmosphere assets from the original brief (served by images.higgs.ai). */
const SKY =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261109_013341_08629ffd-6ab5-44a8-bec8-f1939ab3a6cd.png&w=2048&q=88";
const BALLOONS =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261109_013346_9a3e7023-d72b-4572-a9b2-cc7a8f57a248.png&w=1024&q=90";

export interface DropConfig {
  headline: string;
  paragraph: string;
  linkUrl: string;
  tagline: string;
  word: string;
  cardText: string;
  cardButton: string;
  /** Transparent garment cut-out that hangs from the balloons and falls. */
  garmentUrl: string | null;
  /** Product photo shown in the right-hand card. */
  cardImage: string | null;
  /** Landing scene photo; when empty a CSS boutique is drawn instead. */
  sceneUrl: string | null;
  /** Landing point on the scene, 0–1 of the (cover-fitted) image. */
  landX: number;
  landY: number;
  /** Headline centre on the scene, 0–1. */
  textX: number;
  textY: number;
  /** Landed garment size as a fraction of the scene height. */
  landSize: number;
}

const HOOK = 0.03; // hanger hook, fraction of the frame from the top
const FOOT = 0.96; // hem, fraction of the frame from the top
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (q: number) => q * q * (3 - 2 * q);

export function DropSection({ config }: { config: DropConfig }) {
  const rootRef = useRef<HTMLElement>(null);
  const [scene, setScene] = useState<{ w: number; h: number } | null>(null);

  // Intrinsic size of the uploaded scene, for the cover-fit mapping
  useEffect(() => {
    if (!config.sceneUrl) return setScene(null);
    const img = new Image();
    img.onload = () => setScene({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = config.sceneUrl;
  }, [config.sceneUrl]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sky = root.querySelector<HTMLElement>(".bd-sky")!;
    const card = root.querySelector<HTMLElement>(".bd-card")!;
    const kitchen = root.querySelector<HTMLElement>(".bd-scene")!;
    const balloons = root.querySelector<HTMLElement>(".bd-balloons")!;
    const gS = root.querySelector<HTMLElement>(".bd-garment.s")!;
    const gK = root.querySelector<HTMLElement>(".bd-garment.k")!;
    const ktext = root.querySelector<HTMLElement>(".bd-ktext")!;
    const cardImg = root.querySelector<HTMLImageElement>(".bd-card-media");

    sky.style.backgroundImage = `url("${SKY}")`;
    balloons.style.backgroundImage = `url("${BALLOONS}")`;
    if (config.garmentUrl) {
      gS.style.backgroundImage = gK.style.backgroundImage = `url("${config.garmentUrl}")`;
    }
    kitchen.style.backgroundImage = config.sceneUrl ? `url("${config.sceneUrl}")` : "";

    // Card colour = average of the photo's top-left corner (seamless edge)
    if (cardImg) {
      const sample = () => {
        try {
          const c = document.createElement("canvas");
          c.width = c.height = 8;
          const g = c.getContext("2d", { willReadFrequently: true })!;
          g.drawImage(cardImg, 0, 0, cardImg.naturalWidth * 0.12, cardImg.naturalHeight * 0.12, 0, 0, 8, 8);
          const d = g.getImageData(0, 0, 8, 8).data;
          let r = 0, gg = 0, b = 0;
          for (let i = 0; i < 64; i++) {
            r += d[i * 4];
            gg += d[i * 4 + 1];
            b += d[i * 4 + 2];
          }
          card.style.background = `rgb(${(r / 64) | 0}, ${(gg / 64) | 0}, ${(b / 64) | 0})`;
        } catch {
          /* CORS: keep the fallback colour */
        }
      };
      if (cardImg.complete && cardImg.naturalWidth) sample();
      else cardImg.addEventListener("load", sample, { once: true });
    }

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let S = { x: 0, y: 0, w: 0, h: 0 };
    let Kr = { x: 0, y: 0, w: 0, h: 0 };
    let x0 = 0, y0 = 0, c0 = 0, x1 = 0, y1 = 0, c1 = 0, m = 1;
    let start = 0, end = 1;
    let sp = 0;
    let raf = 0;
    let visible = false;

    const rectDoc = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
    };

    function measure() {
      S = rectDoc(sky);
      Kr = rectDoc(kitchen);
      x0 = S.x + 0.81 * S.w;
      y0 = S.y + 0.525 * S.h;
      c0 = 0.425 * S.h;

      const bw = 0.3 * S.w;
      const bh = (bw * 2048) / 1360;
      const handleY = 0.525 * S.h - c0 / 2 + HOOK * c0;
      balloons.style.left = `${0.81 * S.w - bw * 0.494}px`;
      balloons.style.top = `${handleY - bh * 0.946}px`;

      const iw = scene?.w ?? Kr.w;
      const ih = scene?.h ?? Kr.h;
      const sc = Math.max(Kr.w / iw, Kr.h / ih);
      const ox = (Kr.w - iw * sc) / 2;
      const oy = (Kr.h - ih * sc) / 2;
      const map = (nx: number, ny: number) => ({
        x: Kr.x + ox + nx * iw * sc,
        y: Kr.y + oy + ny * ih * sc,
      });
      const H = ih * sc;
      const gap = map(config.landX, config.landY);
      c1 = H * config.landSize;
      x1 = gap.x;
      y1 = gap.y - c1 * FOOT + c1 / 2;

      const t = map(config.textX, config.textY);
      ktext.style.left = `${t.x - Kr.x}px`;
      ktext.style.top = `${t.y - Kr.y}px`;
      kitchen.style.setProperty("--kh", `${(H * 0.0285).toFixed(1)}px`);
      kitchen.style.setProperty("--kp", `${(H * 0.0205).toFixed(1)}px`);

      start = S.y - 0.093 * innerHeight;
      end = Math.max(start + 200, Kr.y - 0.093 * innerHeight);

      m = Math.ceil(Math.max(c0, c1) * 1.05);
      for (const g of [gS, gK]) {
        g.style.width = `${m}px`;
        g.style.height = `${m}px`;
      }
      draw(performance.now());
    }

    function draw(now: number) {
      const target = (scrollY - start) / (end - start);
      sp += (target - sp) * (reduced ? 1 : 0.18);
      if (Math.abs(target - sp) < 0.0005) sp = target;
      const p = clamp(sp);

      const q = clamp((p - 0.02) / 0.9);
      const t = now / 1000;
      const idle = reduced ? 0 : 1 - clamp(p * 12);
      const bob = idle * Math.sin(1.9 * t) * 6;
      const sway = idle * Math.sin(1.3 * t) * 1.4;

      const x = x0 + (x1 - x0) * smooth(q);
      const y = y0 + (y1 - y0) * Math.pow(q, 1.75) + bob;
      const size = c0 + (c1 - c0) * smooth(q);
      const tilt = Math.sin(q * Math.PI) * -9 + sway;
      // Cloth flutter: the garment turns in the air and lands facing front
      const flutter = Math.sin(clamp((q - 0.12) / 0.72) * Math.PI);
      const scl = size / m;
      const tail = `rotate(${tilt}deg) perspective(1200px) rotateY(${(flutter * 58).toFixed(2)}deg) scale(${scl})`;
      gS.style.transform = `translate(${x - S.x - m / 2}px, ${y - S.y - m / 2}px) ${tail}`;
      gK.style.transform = `translate(${x - Kr.x - m / 2}px, ${y - Kr.y - m / 2}px) ${tail}`;

      const r = clamp(p * 1.25);
      balloons.style.transform = `translate(${r * -0.06 * S.w}px, ${bob - r * 1.25 * S.h}px) rotate(${sway * 1.6 - r * 6}deg)`;

      root!.classList.toggle("landed", p > 0.9);
    }

    const loop = (now: number) => {
      draw(now);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(root);

    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    window.addEventListener("resize", measure);

    (window as unknown as { __olla: unknown }).__olla = {
      get p() {
        return sp;
      },
      measure,
    };

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [config, scene]);

  return (
    <section ref={rootRef} className={`bd ${jost.variable}`} aria-label={config.headline}>
      <div className="bd-hero">
        <div className="bd-sky">
          <div className="bd-tag">{config.tagline}</div>
          <div className="bd-balloons" aria-hidden="true" />
          <div className="bd-garment s" aria-hidden="true" />
          <div className="bd-word" aria-hidden="true">
            {config.word}
          </div>
        </div>
        <aside className="bd-card">
          <span className="bd-new">ШИНЭ</span>
          <p>{config.cardText}</p>
          {config.cardImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="bd-card-media" src={config.cardImage} alt="" crossOrigin="anonymous" />
          )}
          <Link href={config.linkUrl} className="bd-shop">
            {config.cardButton}
          </Link>
        </aside>
      </div>

      <div className="bd-scene">
        {!config.sceneUrl && (
          <div className="bd-set" aria-hidden="true">
            <div className="wall" />
            <div className="arch l" />
            <div className="arch r" />
            <div className="rack l">
              <i style={{ left: "10%", ["--c" as string]: "#2b2a33" }} />
              <i style={{ left: "30%", ["--c" as string]: "#c9b79b" }} />
              <i style={{ left: "52%", ["--c" as string]: "#7d8a74" }} />
              <i style={{ left: "74%", ["--c" as string]: "#efe9df" }} />
            </div>
            <div className="rack r">
              <i style={{ left: "10%", ["--c" as string]: "#b9a58a" }} />
              <i style={{ left: "32%", ["--c" as string]: "#1f2230" }} />
              <i style={{ left: "54%", ["--c" as string]: "#d9cdb8" }} />
              <i style={{ left: "76%", ["--c" as string]: "#8c3b2e" }} />
            </div>
            <div className="floor" />
            <div className="plinth" />
          </div>
        )}
        <div className="bd-garment k" aria-hidden="true" />
        <div className="bd-ktext">
          <h2>{config.headline}</h2>
          <p>{config.paragraph}</p>
        </div>
      </div>
    </section>
  );
}
