/**
 * Runway carousel engine — the imperative half of the "Сет хувцас" section.
 *
 * React renders the static markup (bodies, heroes, ticks, popup shell);
 * this engine owns everything that moves: the 3D ring (desktop) / diagonal
 * line (phones) with spring physics, the hero hand-off, autoplay + tick
 * progress, drag / wheel / keyboard, the custom cursor, the light sweep,
 * the "View look" popup with FLIP and pins, and feet detection.
 */

export interface RunwayCallbacks {
  onIndex: (i: number) => void;
  onHot: (n: number | null, reveal: boolean) => void;
}

export interface RunwayApi {
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
  hot: (n: number | null) => void;
  engage: () => void;
  setPanelHover: (v: boolean) => void;
  destroy: () => void;
}

const K = 95;
const C = 2 * Math.sqrt(K);
const two = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Body {
  el: HTMLElement;
  hit: HTMLButtonElement | null;
  w: number;
  blur: number;
}

export function createRunway(
  root: HTMLElement,
  n: number,
  names: string[],
  cb: RunwayCallbacks
): RunwayApi {
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer =
    typeof matchMedia !== "undefined" &&
    matchMedia("(hover: hover) and (pointer: fine)").matches;

  const q = <T extends Element>(s: string) => root.querySelector(s) as T;
  const stage = q<HTMLElement>("[data-rw-stage]");
  const bodies: Body[] = Array.from(
    root.querySelectorAll<HTMLElement>("[data-rw-model]")
  ).map((el) => ({
    el,
    hit: el.querySelector<HTMLButtonElement>(".rw__hit"),
    w: 0,
    blur: -1,
  }));
  const N = bodies.length;
  const heroes = Array.from(root.querySelectorAll<HTMLElement>("[data-rw-hero]"));
  const ticks = Array.from(root.querySelectorAll<HTMLElement>("[data-rw-tick]"));
  const autoBtn = q<HTMLButtonElement>("[data-rw-auto]");
  const live = q<HTMLElement>("[data-rw-live]");
  const cursor = q<HTMLElement>("[data-rw-cursor]");
  const lb = q<HTMLElement>("[data-rw-lb]");
  const lbStage = q<HTMLElement>("[data-rw-lb-stage]");
  const lbKicker = q<HTMLElement>("[data-rw-lb-kicker]");
  const lbName = q<HTMLElement>("[data-rw-lb-name]");
  const lbClose = q<HTMLButtonElement>("[data-rw-zoom-close]");

  let mode: "ring" | "classic" = "ring";
  let mobile = false;
  let W = 0;
  let H = 0;
  let fs = 1;
  let unit = 120;
  let vh = 0;
  let lastW = 0;

  let index = 0;
  const start = reduced ? 0 : 1.15;
  let target = 0;
  let cur = -start;
  let vel = 0;

  let raf = 0;
  let lastT = 0;
  let still = false;
  let visible = false;
  let dragging = false;
  let zoomed = false;
  let engaged = false;
  let panelHover = false;
  let playing = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let firstIndex = true;
  let zoomCloseTimer: ReturnType<typeof setTimeout> | null = null;

  root.classList.add("rw--js");

  /* ---------------- measure ---------------- */
  function headerHeight() {
    let h = 0;
    document
      .querySelectorAll<HTMLElement>("body > header, header.sticky, [data-site-header]")
      .forEach((el) => {
        if (el.contains(root)) return;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return;
        h = Math.max(h, el.offsetHeight);
      });
    return h;
  }

  function measure() {
    mobile = innerWidth < 750;
    mode = mobile ? "classic" : "ring";
    let frameH: number;
    if (!mobile) {
      frameH = Math.max(380, innerHeight - headerHeight());
    } else {
      if (!vh || innerWidth !== lastW || Math.abs(innerHeight - vh) >= 160)
        vh = innerHeight;
      frameH = vh * (clamp(109, 50, 120) / 100);
    }
    lastW = innerWidth;
    root.style.setProperty("--rw-frame-h", `${Math.round(frameH)}px`);

    const r = stage.getBoundingClientRect();
    W = r.width;
    H = r.height;
    fs = mode === "ring" ? 1.08 : 1;
    root.style.setProperty("--rw-fs", String(fs));
    const modelH =
      mode === "ring"
        ? Math.max(200, Math.round((H - 34 - 18) / 1.08))
        : Math.max(200, Math.round(H - (mobile ? 24 : 36) - 18));
    stage.style.setProperty("--rw-model-h", `${modelH}px`);
    let hx: number;
    let hy: number;
    if (mode === "ring") {
      hx = 0.5 * W;
      hy = 34;
    } else if (mobile) {
      hx = 0.3 * W;
      hy = 22;
    } else {
      hx = 0.4 * W;
      hy = 36;
    }
    stage.style.setProperty("--rw-hx", `${hx}px`);
    stage.style.setProperty("--rw-hy", `${hy}px`);
    root.style.setProperty("--rw-ax", `${((hx / Math.max(1, W)) * 100).toFixed(2)}%`);
    unit = mode === "ring" ? Math.max(mobile ? 90 : 120, 0.3 * W) : Math.max(90, W * 0.32 * 1.6);
    bodies.forEach((b) => (b.w = b.el.offsetWidth || modelH * 0.5625));
    renderAll();
  }

  /* ---------------- placement ---------------- */
  function put(b: Body, x: number, bottom: number, scale: number, op: number, blur: number, z: number) {
    const half = (b.w * scale) / 2;
    if (x + half < -4 || x - half > W + 4) op = 0;
    const el = b.el;
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${(-bottom).toFixed(2)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
    el.style.opacity = op.toFixed(3);
    el.style.zIndex = String(z);
    el.style.visibility = op < 0.01 ? "hidden" : "";
    el.style.pointerEvents = op < 0.5 ? "none" : "";
    const bl = Math.round(blur * 10) / 10;
    if (bl !== b.blur) {
      b.blur = bl;
      el.style.filter = bl <= 0.05 ? "" : `blur(${bl}px)`;
    }
  }

  function wrapPi(a: number) {
    a = a % (2 * Math.PI);
    if (a > Math.PI) a -= 2 * Math.PI;
    if (a <= -Math.PI) a += 2 * Math.PI;
    return a;
  }

  function renderRing() {
    const step = (2 * Math.PI) / N;
    const cx = 0.5 * W;
    const R = (mobile ? 0.72 : 0.62) * W;
    const P = (mobile ? 1.9 : 1.65) * W;
    const floor = H - 34;
    const horizon = 0.36 * H;
    bodies.forEach((b, a) => {
      const phi = wrapPi((a - cur) * step);
      const z = R * (1 - Math.cos(phi));
      const persp = P / (P + z);
      const sl = Math.abs(phi) / step;
      const scale = persp * (1 + (fs - 1) * clamp(1 - sl, 0, 1));
      const x = cx + R * Math.sin(phi) * persp;
      const feet = horizon + (floor - horizon) * persp;
      const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
      let op = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);
      if (still && sl < 0.02) op = 0;
      put(b, x, H - feet, scale, op, root.dataset.blur === "false" ? 0 : blur, Math.round(scale * 1000));
    });
  }

  function renderClassic() {
    const ax = mobile ? 0.3 : 0.4;
    const ay = mobile ? 22 : 36;
    const sx = mobile ? 0.32 : 0.125;
    const sy = mobile ? 22 : 58;
    const sr = 0.76;
    const ex = mobile ? 0.55 : 0.38;
    const d = mobile ? 4 : 5;
    bodies.forEach((b, a) => {
      let k = (((a - cur) % N) + N) % N;
      if (k >= N - 1) k -= N; // [-1, N-1)
      if (k < 0) {
        const e = Math.min(-k, 1.4);
        put(b, W * (ax - ex * e), ay - 22 * e, 1 + 0.14 * e, Math.max(0, 1 - 1.05 * e), 4 * Math.min(e, 1), 1100);
        return;
      }
      let op = k <= d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (d - k));
      if (still && k < 0.02) op = 0;
      put(b, W * (ax + sx * k), ay + sy * k, Math.pow(sr, k), op, Math.min(0.9 * k, 3.2), 1000 - Math.round(10 * k));
    });
  }

  function renderAll() {
    if (!W) return;
    if (mode === "ring") renderRing();
    else renderClassic();
  }

  function setStill(v: boolean) {
    if (v === still) return;
    still = v;
    root.classList.toggle("rw--still", v);
  }

  /* ---------------- loop ---------------- */
  function frame(t: number) {
    raf = 0;
    const dt = lastT ? Math.min(0.034, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    if (reduced) {
      cur = target;
      vel = 0;
    } else {
      const h = dt / 3;
      for (let i = 0; i < 3; i++) {
        const acc = -K * (cur - target) - C * vel;
        vel += acc * h;
        cur += vel * h;
      }
    }
    const settled = Math.abs(cur - target) <= 0.0005 && Math.abs(vel) <= 0.0005;
    if (settled) {
      cur = target;
      vel = 0;
    }
    setStill(settled && !dragging);
    renderAll();
    if ((!settled || dragging) && visible && !document.hidden) raf = requestAnimationFrame(frame);
    else lastT = 0;
  }

  function kick() {
    if (!raf && visible && !document.hidden) {
      lastT = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  /* ---------------- index ---------------- */
  function rankOf(a: number) {
    const r = Math.round(target);
    let k = (((a - r) % N) + N) % N;
    if (mode === "ring" && k > N / 2) k -= N;
    return k;
  }

  function setIndex(i: number) {
    const prevIdx = index;
    const changed = i !== prevIdx || firstIndex;
    index = i;
    bodies.forEach((b, a) => {
      const k = rankOf(a);
      const reach = mode === "ring" ? 2 : 3;
      const on = k !== 0 && Math.abs(k) <= reach;
      if (b.hit) b.hit.tabIndex = on ? 0 : -1;
      if (on) b.el.removeAttribute("aria-hidden");
      else b.el.setAttribute("aria-hidden", "true");
    });
    if (!changed) return;
    const silent = firstIndex;
    firstIndex = false;
    if (zoomed) closeZoom();
    root.style.setProperty("--rw-progress", ((i + 1) / n).toFixed(3));
    heroes.forEach((h, j) => {
      h.classList.toggle("is-on", j === i);
      h.classList.toggle("was", j === prevIdx && j !== i);
      h.setAttribute("aria-hidden", j === i ? "false" : "true");
      const z = h.querySelector<HTMLButtonElement>("[data-rw-zoom]");
      if (z) z.tabIndex = j === i ? 0 : -1;
    });
    if (!silent && !reduced) {
      stage.classList.remove("is-sweep");
      void stage.offsetWidth;
      stage.classList.add("is-sweep");
    }
    if (!silent && live) live.textContent = `Сет ${i + 1}: ${names[i] ?? ""}`;
    ticks.forEach((t, j) => {
      t.setAttribute("aria-current", j === i ? "true" : "false");
      t.classList.toggle("is-past", j < i);
    });
    clearHot();
    cb.onIndex(i);
    restartBar();
  }

  function moveTo(T: number) {
    target = T;
    setStill(false);
    setIndex(((T % n) + n) % n);
    kick();
  }
  const next = () => moveTo(Math.round(target) + 1);
  const prev = () => moveTo(Math.round(target) - 1);
  function go(i: number) {
    let d = (((i - index) % n) + n) % n;
    if (d > n / 2) d -= n;
    moveTo(Math.round(target) + d);
  }

  /* ---------------- autoplay ---------------- */
  const speed = Number(root.dataset.speed) || 5000;
  function restartBar() {
    ticks.forEach((t) => t.classList.remove("is-run"));
    if (timer) clearTimeout(timer);
    timer = null;
    if (!playing) return;
    const t = ticks[index];
    if (t) {
      void t.offsetWidth;
      t.classList.add("is-run");
    }
    timer = setTimeout(() => {
      if (playing && visible && !dragging && !document.hidden && !panelHover && !zoomed && !engaged) next();
      else restartBar();
    }, speed);
  }
  function play(v: boolean) {
    playing = v;
    root.classList.toggle("is-playing", v);
    autoBtn?.classList.toggle("is-playing", v);
    autoBtn?.setAttribute("aria-pressed", v ? "true" : "false");
    restartBar();
  }
  function engage() {
    engaged = true;
    if (playing) play(false);
  }

  /* ---------------- hot linking ---------------- */
  function clearHot() {
    root.querySelectorAll(".rw__pin.is-hot").forEach((p) => p.classList.remove("is-hot"));
  }
  function hot(num: number | null, reveal = false) {
    clearHot();
    if (num != null) {
      const scope = zoomed ? lbStage : heroes[index];
      scope?.querySelector(`[data-rw-pin="${num}"]`)?.classList.add("is-hot");
    }
    cb.onHot(num, reveal);
  }

  /* ---------------- popup ---------------- */
  function figureOf(el: ParentNode | null) {
    return el?.querySelector<HTMLElement>(".rw__figure") ?? null;
  }
  function openZoom() {
    if (zoomed) return;
    const hero = heroes[index];
    const morph = hero?.querySelector(".rw__morph");
    if (!morph) return;
    engage();
    clearHot();
    const wrap = document.createElement("div");
    wrap.className = "rw__lb-model";
    morph.childNodes.forEach((c) => wrap.appendChild(c.cloneNode(true)));
    wrap.querySelector(".rw__zoom")?.remove();
    wrap.querySelectorAll<HTMLElement>(".rw__pin").forEach((p) => (p.tabIndex = 0));
    wrap.querySelectorAll("img").forEach((img) => {
      img.loading = "eager";
      img.classList.add("is-decoded");
    });
    const foot = hero.style.getPropertyValue("--rw-foot");
    if (foot) wrap.style.setProperty("--rw-foot", foot);
    if (zoomCloseTimer) clearTimeout(zoomCloseTimer);
    lbStage.replaceChildren(wrap);
    lbKicker.textContent = `Сет ${two(index + 1)}`;
    lbName.textContent = names[index] ?? "";
    const sr = lbStage.getBoundingClientRect();
    const h = Math.max(160, Math.min(sr.height, sr.width / 0.5625));
    wrap.style.setProperty("--rw-model-h", `${h}px`);
    zoomed = true;
    root.classList.add("rw--zoom");
    lb.setAttribute("aria-hidden", "false");
    lbClose.focus({ preventScroll: true });
    if (!reduced) {
      const a = figureOf(hero)!.getBoundingClientRect();
      const b = figureOf(wrap)!.getBoundingClientRect();
      wrap.style.transition = "none";
      wrap.style.transformOrigin = "0 100%";
      wrap.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
      void wrap.offsetWidth;
      wrap.style.transition = "";
      wrap.style.transform = "";
    }
  }
  function closeZoom() {
    if (!zoomed) return;
    const wrap = lbStage.querySelector<HTMLElement>(".rw__lb-model");
    const hero = heroes[index];
    if (wrap && hero && !reduced) {
      const a = figureOf(hero)!.getBoundingClientRect();
      const b = figureOf(wrap)!.getBoundingClientRect();
      const cs = getComputedStyle(wrap).transform;
      const scaleNow = cs && cs !== "none" ? new DOMMatrix(cs).a : 1;
      const bh = b.height / (scaleNow || 1);
      wrap.style.transformOrigin = "0 100%";
      wrap.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / bh})`;
    }
    zoomed = false;
    root.classList.remove("rw--zoom");
    lb.setAttribute("aria-hidden", "true");
    if (lb.contains(document.activeElement)) stage.focus({ preventScroll: true });
    zoomCloseTimer = setTimeout(() => lbStage.replaceChildren(), 950);
    restartBar();
  }

  /* ---------------- clicks ---------------- */
  let suppressClick = 0;
  const onClickCapture = (e: MouseEvent) => {
    if (Date.now() < suppressClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-rw-zoom-close]")) return closeZoom();
    if (zoomed && (t === lbStage || t === lb)) return closeZoom();
    const zoomBtn = t.closest("[data-rw-zoom]");
    if (zoomBtn) return openZoom();
    if (t.closest("[data-rw-next]")) return next();
    if (t.closest("[data-rw-prev]")) return prev();
    const tick = t.closest<HTMLElement>("[data-rw-tick]");
    if (tick) return go(Number(tick.dataset.rwTick));
    if (t.closest("[data-rw-auto]")) {
      if (!playing) engaged = false;
      return play(!playing);
    }
    const pin = t.closest<HTMLElement>("[data-rw-pin]");
    if (pin) {
      engage();
      return hot(Number(pin.dataset.rwPin), true);
    }
    const goBtn = t.closest<HTMLElement>("[data-rw-go]");
    if (goBtn) {
      const body = goBtn.closest<HTMLElement>("[data-rw-model]");
      const a = bodies.findIndex((b) => b.el === body);
      const k = rankOf(a);
      if (k !== 0 && Math.abs(k) < 6) return moveTo(Math.round(target) + k);
      if (k === 0) return openZoom();
    }
  };
  root.addEventListener("click", onClickCapture, true);
  root.addEventListener("click", onClick);

  /* ---------------- drag ---------------- */
  let pid: number | null = null;
  let sx = 0;
  let sy = 0;
  let t0 = 0;
  let abandoned = false;
  let samples: { x: number; t: number }[] = [];
  const onDown = (e: PointerEvent) => {
    if (zoomed) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pid = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    t0 = target;
    abandoned = false;
    samples = [{ x: e.clientX, t: performance.now() }];
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pid || abandoned) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return onUp(e);
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (!dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        abandoned = true;
        return;
      }
      if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
        dragging = true;
        root.classList.add("is-dragging");
        try {
          stage.setPointerCapture(e.pointerId);
        } catch {}
      } else return;
    }
    samples.push({ x: e.clientX, t: performance.now() });
    if (samples.length > 6) samples.shift();
    target = t0 - dx / unit;
    setStill(false);
    kick();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    pid = null;
    if (!dragging) return;
    dragging = false;
    root.classList.remove("is-dragging");
    suppressClick = Date.now() + 60;
    const dx = e.clientX - sx;
    const f = samples[0];
    const l = samples[samples.length - 1];
    const vx = l && f && l.t > f.t ? (l.x - f.x) / (l.t - f.t) : 0;
    const sign = -1;
    const from = Math.round(t0);
    if (mobile) {
      if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) moveTo(from + sign * (dx > 0 ? 1 : -1));
      else moveTo(from);
    } else {
      let i = Math.round(target + (sign * vx * 160) / unit);
      if (i === from && Math.abs(vx) > 0.3) i = from + sign * Math.sign(vx);
      i = clamp(i, from - 2, from + 2);
      moveTo(i);
    }
  };
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);

  /* ---------------- wheel + keys ---------------- */
  let wAcc = 0;
  let wLock = 0;
  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (Date.now() < wLock) return;
    wAcc += e.deltaX;
    if (Math.abs(wAcc) > 45) {
      if (wAcc > 0) next();
      else prev();
      wAcc = 0;
      wLock = Date.now() + 520;
    }
  };
  stage.addEventListener("wheel", onWheel, { passive: false });
  const onStageKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };
  stage.addEventListener("keydown", onStageKey);
  const onRootKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && zoomed) closeZoom();
  };
  root.addEventListener("keydown", onRootKey);

  /* ---------------- cursor ---------------- */
  let cx = 0;
  let cy = 0;
  let ctx = 0;
  let cty = 0;
  let craf = 0;
  let cOn = false;
  const cursorLoop = () => {
    craf = 0;
    const f = reduced ? 1 : 0.18;
    cx += (ctx - cx) * f;
    cy += (cty - cy) * f;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    if (Math.hypot(ctx - cx, cty - cy) > 0.2) craf = requestAnimationFrame(cursorLoop);
  };
  const onCursorMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = stage.getBoundingClientRect();
    ctx = e.clientX - r.left;
    cty = e.clientY - r.top;
    if (!cOn) {
      cx = ctx;
      cy = cty;
      cOn = true;
      cursor.classList.add("is-on");
    }
    const t = e.target as HTMLElement;
    cursor.classList.toggle("is-view", !dragging && !!t.closest(".rw__hero.is-on [data-rw-zoom]"));
    cursor.classList.toggle("is-link", !dragging && !!t.closest(".rw__pin, .rw__hit"));
    if (!craf) craf = requestAnimationFrame(cursorLoop);
  };
  const onCursorLeave = () => {
    cOn = false;
    cursor.classList.remove("is-on", "is-link", "is-view");
  };
  if (finePointer && cursor) {
    root.classList.add("rw--cursor");
    stage.addEventListener("pointermove", onCursorMove);
    stage.addEventListener("pointerleave", onCursorLeave);
  } else cursor?.remove();

  /* ---------------- feet detection ---------------- */
  heroes.forEach((hero, i) => {
    const src = hero.dataset.probe;
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 48;
        const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const g = c.getContext("2d", { willReadFrequently: true })!;
        // mirror object-fit: contain inside a 9:16 box, bottom-aligned
        const boxH = w / 0.5625;
        c.height = Math.round(boxH);
        const s = Math.min(w / img.naturalWidth, boxH / img.naturalHeight);
        const dw = img.naturalWidth * s;
        const dh = img.naturalHeight * s;
        g.drawImage(img, (w - dw) / 2, c.height - dh, dw, dh);
        const data = g.getImageData(0, 0, w, c.height).data;
        let last = -1;
        for (let y = c.height - 1; y >= 0 && last < 0; y--)
          for (let x = 0; x < w; x++)
            if (data[(y * w + x) * 4 + 3] > 40) {
              last = y;
              break;
            }
        if (last < 0) return;
        const foot = clamp((c.height - 1 - last) / c.height, 0, 0.4).toFixed(4);
        hero.style.setProperty("--rw-foot", foot);
        bodies.forEach((b) => {
          if (Number(b.el.dataset.index) % n === i) b.el.style.setProperty("--rw-foot", foot);
        });
      } catch {
        /* tainted canvas: keep offset 0 */
      }
    };
    img.src = src;
  });

  /* decoded images fade in */
  root.querySelectorAll<HTMLImageElement>("[data-model-image]").forEach((img) => {
    const done = () => img.classList.add("is-decoded");
    if (img.complete && img.naturalWidth) done();
    else
      img
        .decode()
        .then(done)
        .catch(() => img.addEventListener("load", done, { once: true }));
  });

  /* ---------------- visibility ---------------- */
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
  });
  io.observe(root);
  const reveal = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      reveal.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-revealed")));
    },
    { rootMargin: "0px 0px -22% 0px" }
  );
  if (reduced) root.classList.add("is-revealed");
  else reveal.observe(root);
  const onVis = () => {
    if (!document.hidden) kick();
    restartBar();
  };
  document.addEventListener("visibilitychange", onVis);

  let rt: ReturnType<typeof setTimeout> | null = null;
  const onResize = () => {
    if (rt) clearTimeout(rt);
    rt = setTimeout(() => {
      measure();
      kick();
    }, 120);
  };
  window.addEventListener("resize", onResize);
  const ro = new ResizeObserver(() => onResize());
  ro.observe(stage);

  measure();
  setIndex(0);
  if (root.dataset.autoplay === "true" && !reduced) play(true);
  kick();

  return {
    go,
    next,
    prev,
    hot: (num) => hot(num, false),
    engage,
    setPanelHover: (v) => {
      panelHover = v;
      if (!v) restartBar();
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      if (craf) cancelAnimationFrame(craf);
      if (timer) clearTimeout(timer);
      if (rt) clearTimeout(rt);
      if (zoomCloseTimer) clearTimeout(zoomCloseTimer);
      io.disconnect();
      reveal.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onRootKey);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onStageKey);
      stage.removeEventListener("pointermove", onCursorMove);
      stage.removeEventListener("pointerleave", onCursorLeave);
    },
  };
}
