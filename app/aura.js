// An aura: a person's answers drawn as light. Each chosen signal is one glow in its group's hue (tempo warm,
// taste lime, people magenta, mode cyan); the tempo dial sets how fast the glows drift, the depth dial how
// close and layered they sit. It is a picture of the answers, never a measurement of the person.
// One frame loop serves every aura on the page, and runs only while an aura is on screen and motion is allowed.
import { VIBES } from "./vibes.js";

const GROUP_HUE = { tempo: 32, taste: 118, people: 342, mode: 205 };
const STEP = 13;

// OKLCH → sRGB (Björn Ottosson's matrices), so the canvas gets a colour every browser parses.
export function oklchToRgb(l, c, h) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr), b = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return lin.map((x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.max(x, 0) ** (1 / 2.4) - 0.055;
    return Math.round(255 * Math.min(1, Math.max(0, v)));
  });
}

export function hueOf(id) {
  const v = VIBES.find((x) => x.id === id);
  if (!v) return 0;
  const i = VIBES.filter((x) => x.group === v.group).indexOf(v);
  return (GROUP_HUE[v.group] + (i - 1.5) * STEP + 360) % 360;
}

/** The css colour of a signal, for its dot and its lit label. */
export const signalColor = (id, l = 0.8) => `oklch(${l} 0.17 ${hueOf(id).toFixed(0)})`;

// A small deterministic hash, so one set of answers always draws the same aura.
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967295; };

/** The glows of a profile: { picks, tempo, depth } → [{ rgb, x, y, r, phase, speed }] in unit space. */
export function auraLayers({ picks = [], tempo = 50, depth = 50 }) {
  const spread = 0.34 - (depth / 100) * 0.22;
  const speed = 0.05 + (tempo / 100) * 0.35;
  // Many glows add up to white under "lighter"; each one dims with the count so the colours stay colours.
  const gain = 1 / Math.sqrt(Math.max(1, picks.length / 2));
  const glows = picks.map((id, i) => {
    const a = hash(id) * Math.PI * 2 + i * 0.4;
    const d = spread * (0.45 + hash(id + "d") * 0.55);
    return {
      rgb: oklchToRgb(0.74, 0.19, hueOf(id)),
      x: 0.5 + Math.cos(a) * d, y: 0.5 + Math.sin(a) * d,
      r: 0.26 + (depth / 100) * 0.12 + hash(id + "r") * 0.08,
      phase: hash(id + "p") * Math.PI * 2, speed: speed * (0.7 + hash(id + "s") * 0.6), gain,
    };
  });
  // An empty board is a dim ember, not nothing: the aura is waiting.
  if (!glows.length) glows.push({ rgb: [70, 62, 82], x: 0.5, y: 0.5, r: 0.3, phase: 0, speed: 0.06, gain: 1 });
  return glows;
}

const auras = new Set();
let still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let frame = 0;

function tick(now) {
  frame = 0;
  let live = false;
  for (const a of auras) if (a.visible) { a.draw(now / 1000); live = true; }
  if (live && !still) frame = requestAnimationFrame(tick);
}
const wake = () => { if (!frame && !still) frame = requestAnimationFrame(tick); };

/** Stop or start every aura's drift (the page's motion switch and the reduced-motion setting). */
export function setStill(on) {
  still = on;
  for (const a of auras) a.draw(0);
  wake();
}
export const isStill = () => still;

export class Aura {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.from = this.to = auraLayers({});
    this.mix = 1;
    this.visible = true;
    auras.add(this);
    if (typeof IntersectionObserver === "function") {
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) wake(); }).observe(canvas);
    }
    this.size();
    this.draw(0);
    wake();
  }
  size() {
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    if (this.canvas.width !== w) { this.canvas.width = w; this.canvas.height = w; }
  }
  /** Leave the frame loop (the canvas left the page). */
  dispose() { auras.delete(this); }
  /** Bloom from the current glows into the ones of these answers. */
  set(profile) {
    this.from = this.current ?? this.to;
    this.to = auraLayers(profile);
    this.started = performance.now() / 1000;
    this.mix = still ? 1 : 0;
    this.draw(this.started);
    wake();
  }
  layersAt(t) {
    if (this.mix < 1) this.mix = Math.min(1, (t - this.started) / 0.9);
    const e = 0.5 - Math.cos(Math.PI * this.mix) / 2;
    // Glows that stay keep their place and grow; new ones bloom from nothing, removed ones fade out.
    const out = this.to.map((g) => ({ ...g, alpha: e }));
    if (e < 1) for (const g of this.from) out.push({ ...g, alpha: 1 - e });
    return out;
  }
  draw(t) {
    this.size();
    const { ctx, canvas } = this;
    const W = canvas.width;
    const layers = this.layersAt(t);
    this.current = this.to;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, W);
    ctx.globalCompositeOperation = "lighter";
    for (const g of layers) {
      const wob = still ? 0 : 0.045;
      const x = (g.x + Math.sin(t * g.speed * 2 + g.phase) * wob) * W;
      const y = (g.y + Math.cos(t * g.speed * 1.6 + g.phase) * wob) * W;
      const r = g.r * W * (1 + (still ? 0 : Math.sin(t * g.speed + g.phase) * 0.06));
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const [R, G, B] = g.rgb;
      const k = g.alpha * g.gain;
      grad.addColorStop(0, `rgba(${R},${G},${B},${0.85 * k})`);
      grad.addColorStop(0.45, `rgba(${R},${G},${B},${0.32 * k})`);
      grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, W);
    }
  }
}

globalThis.addEventListener?.("resize", () => { for (const a of auras) a.draw(performance.now() / 1000); });

/** The page's motion switch: it stops every aura, every loop and the grain, for this visit. Loops play
 *  only on screen, and none plays when the person's setting asks for reduced motion (the posters stay). */
export function mountMotion(labels) {
  const videos = [...document.querySelectorAll("video.loop")];
  const onScreen = new Set();
  const sync = () => {
    document.documentElement.classList.toggle("still", still);
    for (const v of videos) {
      if (!still && onScreen.has(v)) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
    }
  };
  if (typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target);
      sync();
    }, { rootMargin: "120px" });
    videos.forEach((v) => io.observe(v));
  }
  const b = document.createElement("button");
  b.type = "button";
  b.className = "motion";
  const draw = () => { b.setAttribute("aria-pressed", String(still)); b.textContent = still ? labels.off : labels.on; };
  b.addEventListener("click", () => { setStill(!still); draw(); sync(); });
  draw();
  (document.querySelector(".site-foot .row, .stage") ?? document.body).append(b);
  sync();
}
