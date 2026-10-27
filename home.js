// The landing page's aura mixer: pick signals and set two dials, your aura forms, and the eight sample people
// drift toward the middle as your vibes rhyme. It uses the vibe check's own signals, profiles and score, and it
// runs in this tab only: nothing is sent and nothing is stored.
import { VIBES, GROUPS, labelOf } from "./app/vibes.js";
import { SAMPLE_PROFILES } from "./app/profiles.js";
import { scoreOf } from "./app/score.js";
import { Aura, mountMotion, signalColor } from "./app/aura.js";

const locale = ["en", "es", "zh-Hans"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";
const list = (xs, and) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${and} ${xs.at(-1)}`);
const M = {
  en: {
    groups: { tempo: "Tempo", taste: "Taste", people: "People", mode: "Mode" },
    idle: "Pick a few signals. Your aura forms in the middle.",
    sample: "sample",
    near: { close: "close", some: "a little apart", far: "far apart" },
    closest: (n, s, d) => `<b>${n}</b> drifted closest: you share ${s}. Your dials sit ${d}.`,
    one: (n, s, d) => s ? `<b>${n}</b> (sample): you share ${s}. Your dials sit ${d}.` : `<b>${n}</b> (sample): no shared signals yet. Your dials sit ${d}.`,
    none: "No shared signals with anyone yet. Try one more.",
    label: (n, k) => `${n}, sample profile: ${k} shared signals`,
    and: "and", on: "Motion on", off: "Motion off",
  },
  es: {
    groups: { tempo: "Ritmo", taste: "Gusto", people: "Gente", mode: "Modo" },
    idle: "Elige unas señales. Tu aura se forma en el centro.",
    sample: "ejemplo",
    near: { close: "cerca", some: "un poco lejos", far: "lejos" },
    closest: (n, s, d) => `<b>${n}</b> se acercó más: comparten ${s}. Sus diales están ${d}.`,
    one: (n, s, d) => s ? `<b>${n}</b> (ejemplo): comparten ${s}. Sus diales están ${d}.` : `<b>${n}</b> (ejemplo): sin señales en común todavía. Sus diales están ${d}.`,
    none: "Todavía no compartes señales con nadie. Prueba una más.",
    label: (n, k) => `${n}, perfil de ejemplo: ${k} señales en común`,
    and: "y", on: "Movimiento sí", off: "Movimiento no",
  },
  "zh-Hans": {
    groups: { tempo: "节奏", taste: "品味", people: "人", mode: "状态" },
    idle: "挑几个信号。你的光晕会在中间成形。",
    sample: "样例",
    near: { close: "很近", some: "有点远", far: "很远" },
    closest: (n, s, d) => `<b>${n}</b> 靠得最近：你们共享 ${s}。旋钮${d}。`,
    one: (n, s, d) => s ? `<b>${n}</b>（样例）：你们共享 ${s}。旋钮${d}。` : `<b>${n}</b>（样例）：暂时没有共同信号。旋钮${d}。`,
    none: "还没有和任何人共享信号。再挑一个试试。",
    label: (n, k) => `${n}，样例档案：共享 ${k} 个信号`,
    and: "和", on: "动效：开", off: "动效：关",
  },
};
const t = M[locale];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const me = { picks: [], tempo: 50, depth: 50 };
let chosen = null;
const setlist = document.getElementById("setlist");
const field = document.getElementById("field");
const readout = document.getElementById("readout");
const tempo = document.getElementById("tempo");
const depth = document.getElementById("depth");
const toApp = document.getElementById("to-app");

setlist.innerHTML = GROUPS.map((g) => `<fieldset><legend class="label">${esc(t.groups[g])}</legend>
  ${VIBES.filter((v) => v.group === g).map((v) => `<button type="button" class="signal" data-id="${v.id}" aria-pressed="false">${esc(v.label[locale])}</button>`).join("")}
</fieldset>`).join("");
for (const b of setlist.querySelectorAll(".signal")) b.style.setProperty("--sig", signalColor(b.dataset.id));

const mine = new Aura(document.getElementById("me"));
const samples = SAMPLE_PROFILES.map((p, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "sample";
  b.setAttribute("aria-pressed", "false");
  b.innerHTML = `<canvas width="160" height="160" aria-hidden="true"></canvas><span aria-hidden="true">${esc(p.name)}<small>${esc(t.sample)}</small></span>`;
  field.append(b);
  const aura = new Aura(b.querySelector("canvas"));
  aura.set(p);
  b.addEventListener("click", () => { chosen = chosen === p.id ? null : p.id; update(); });
  return { p, b, angle: -Math.PI / 2 + (i * 2 * Math.PI) / SAMPLE_PROFILES.length + 0.2 };
});

const dialWords = (c) => (c >= 0.85 ? t.near.close : c >= 0.65 ? t.near.some : t.near.far);

function place() {
  const half = field.clientWidth / 2;
  for (const s of samples) {
    const { score } = me.picks.length ? scoreOf(s.p, me) : { score: 0 };
    // Rings are close vibes in the middle, far ones at the rim: score 100 sits beside you, score 0 on the edge.
    const r = half * (0.3 + (1 - score / 100) * 0.55);
    s.b.style.setProperty("--x", `${(Math.cos(s.angle) * r).toFixed(1)}px`);
    s.b.style.setProperty("--y", `${(Math.sin(s.angle) * r).toFixed(1)}px`);
  }
}

function update() {
  mine.set(me);
  const ranked = samples.map((s) => ({ s, ...scoreOf(s.p, me) })).sort((a, b) => b.score - a.score);
  for (const { s, shared } of ranked) {
    s.b.setAttribute("aria-pressed", String(chosen === s.p.id));
    s.b.setAttribute("aria-label", t.label(s.p.name, me.picks.length ? shared.length : 0));
  }
  place();
  const say = (r, f) => f(esc(r.s.p.name), list(r.shared.map((id) => esc(labelOf(id, locale))), t.and), dialWords(r.closeness));
  const pick = chosen && ranked.find((r) => r.s.p.id === chosen);
  const words = pick ? say(pick, t.one) : !me.picks.length ? esc(t.idle) : !ranked[0].shared.length ? esc(t.none) : say(ranked[0], t.closest);
  // A fader moves many times a second; the live region speaks only when its words change.
  if (readout.innerHTML !== words) readout.innerHTML = words;
  const q = new URLSearchParams({ s: me.picks.join(","), t: me.tempo, d: me.depth });
  toApp.href = `app/?${q}`;
}

setlist.addEventListener("click", (e) => {
  const b = e.target.closest(".signal");
  if (!b) return;
  const on = !me.picks.includes(b.dataset.id);
  me.picks = on ? [...me.picks, b.dataset.id] : me.picks.filter((x) => x !== b.dataset.id);
  b.setAttribute("aria-pressed", String(on));
  update();
});
for (const [input, key] of [[tempo, "tempo"], [depth, "depth"]]) input.addEventListener("input", () => { me[key] = Number(input.value); update(); });
addEventListener("resize", place);

update();
mountMotion(t);
