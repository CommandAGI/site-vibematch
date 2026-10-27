// The VibeMatch vibe check: pick signals, set two dials, meet three sample people whose vibes rhyme.
// It runs in this tab only (the pages are served with connect-src 'none'), and every profile is fictional.
// The score and its two parts are the ones the about page writes down: 72% shared signals + 28% dial closeness.
import { VIBES, GROUPS, labelOf } from "./vibes.js";
import { SAMPLE_PROFILES } from "./profiles.js";
import { avatarSvg } from "./avatar.js";
import { rankedMatches } from "./score.js";
import { Aura, mountMotion, signalColor } from "./aura.js";

const locale = ["en", "es", "zh-Hans"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";

const M = {
  en: {
    on: "Motion on", off: "Motion off",
    step: (n) => `Step ${n} of 3`,
    steps: ["Signals", "Dials", "Matches"],
    pickTitle: "What feels like you?",
    pickLede: "Choose at least four of the sixteen. There is no right answer, and no essay question after this.",
    picked: (n) => (n < 4 ? `${n} of 4 chosen` : `${n} chosen`),
    groups: { tempo: "Tempo", taste: "Taste", people: "People", mode: "Mode" },
    next: "Next",
    back: "Back",
    dialTitle: "Set your two dials",
    dialLede: "Where your week sits, and how deep you like to talk. Close is enough; we are not grading you.",
    tempoLow: "slow", tempoHigh: "fast", tempoName: "Tempo",
    depthLow: "silly", depthHigh: "deep", depthName: "Depth",
    find: "Find my people",
    matchTitle: "Three people whose vibe rhymes",
    matchLede: "Each one names the signals you share and how close your dials sit. Nothing was sent anywhere.",
    score: (n) => `${n}% vibe`,
    shared: (n) => `${n} shared`,
    sharedNone: "no signals in common yet",
    dials: (t, d) => `dials: tempo ${t}, depth ${d}`,
    sayHi: "Say hi",
    openerTitle: (name) => `Your intro to ${name}`,
    openerNote: "In the real product we send this to their inbox. In the demo nothing leaves this page.",
    close: "Close",
    again: "Start the check again",
    sample: "Sample profile",
    sent: "Intro written",
    need: "Choose at least four signals to go on.",
    born: "The score is 72% shared signals + 28% dial closeness, rounded. Two people can disagree with it; that is why the parts are shown.",
  },
  es: {
    on: "Movimiento sí", off: "Movimiento no",
    step: (n) => `Paso ${n} de 3`,
    steps: ["Señales", "Diales", "Coincidencias"],
    pickTitle: "¿Qué se siente como tú?",
    pickLede: "Elige al menos cuatro de las dieciséis. No hay respuesta correcta ni pregunta de ensayo después.",
    picked: (n) => (n < 4 ? `${n} de 4 elegidas` : `${n} elegidas`),
    groups: { tempo: "Ritmo", taste: "Gusto", people: "Gente", mode: "Modo" },
    next: "Siguiente",
    back: "Atrás",
    dialTitle: "Ajusta tus dos diales",
    dialLede: "Dónde está tu semana y qué tan profundo te gusta hablar. Cerca ya alcanza; no estamos calificando.",
    tempoLow: "lento", tempoHigh: "rápido", tempoName: "Ritmo",
    depthLow: "juguetón", depthHigh: "profundo", depthName: "Profundidad",
    find: "Buscar mi gente",
    matchTitle: "Tres personas cuya vibra rima",
    matchLede: "Cada una nombra las señales que comparten y qué tan cerca están sus diales. No se envió nada a ningún lado.",
    score: (n) => `${n}% de vibra`,
    shared: (n) => `${n} en común`,
    sharedNone: "ninguna señal en común todavía",
    dials: (t, d) => `diales: ritmo ${t}, profundidad ${d}`,
    sayHi: "Saludar",
    openerTitle: (name) => `Tu presentación a ${name}`,
    openerNote: "En el producto real enviamos esto a su bandeja. En la prueba nada sale de esta página.",
    close: "Cerrar",
    again: "Empezar la prueba otra vez",
    sample: "Perfil de ejemplo",
    sent: "Presentación escrita",
    need: "Elige al menos cuatro señales para seguir.",
    born: "El puntaje es 72% señales compartidas + 28% cercanía de diales, redondeado. Dos personas pueden no estar de acuerdo; por eso mostramos las partes.",
  },
  "zh-Hans": {
    on: "动效：开", off: "动效：关",
    step: (n) => `第 ${n} 步，共 3 步`,
    steps: ["信号", "旋钮", "匹配"],
    pickTitle: "什么感觉像你？",
    pickLede: "从十六个里至少选四个。没有正确答案，之后也没有小作文。",
    picked: (n) => (n < 4 ? `已选 ${n} 个，共需 4 个` : `已选 ${n} 个`),
    groups: { tempo: "节奏", taste: "品味", people: "人", mode: "状态" },
    next: "下一步",
    back: "返回",
    dialTitle: "调好两个旋钮",
    dialLede: "你的一周落在哪里，你多喜欢深聊。接近就够了；我们不是在打分。",
    tempoLow: "慢", tempoHigh: "快", tempoName: "节奏",
    depthLow: "轻松", depthHigh: "深入", depthName: "深度",
    find: "找到我的人",
    matchTitle: "三个和你氛围押韵的人",
    matchLede: "每一个都写明你们共享的信号，以及旋钮有多接近。什么都没有发送到任何地方。",
    score: (n) => `${n}% 氛围`,
    shared: (n) => `共享 ${n} 个`,
    sharedNone: "暂时没有共同信号",
    dials: (t, d) => `旋钮：节奏 ${t}，深度 ${d}`,
    sayHi: "打个招呼",
    openerTitle: (name) => `你给 ${name} 的开场`,
    openerNote: "在真实产品里，我们会把它发到对方的收件箱。在演示里，什么都不会离开这个页面。",
    close: "关闭",
    again: "重新开始测试",
    sample: "样例档案",
    sent: "开场已写好",
    need: "至少选四个信号再继续。",
    born: "分数是 72% 共享信号 + 28% 旋钮贴近度，取整。两个人可以不同意它；所以我们把两部分都写出来。",
  },
};
const t = M[locale];

const view = document.getElementById("view");
const progress = document.getElementById("progress");
const openerDialog = document.getElementById("opener-dialog");

const state = { picks: [], tempo: 50, depth: 50, intro: null };
// The landing page's mixer hands its answers over in the address (?s=…&t=…&d=…): nothing is stored.
{
  const q = new URLSearchParams(location.search);
  const known = new Set(VIBES.map((v) => v.id));
  state.picks = (q.get("s") ?? "").split(",").filter((id) => known.has(id));
  for (const [k, key] of [["t", "tempo"], ["d", "depth"]]) {
    const n = Number(q.get(k));
    if (q.has(k) && Number.isFinite(n)) state[key] = Math.min(100, Math.max(0, Math.round(n)));
  }
}
const meAura = new Aura(document.getElementById("me-aura"));
const drawMe = () => meAura.set(state);
let matchAuras = [];
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function stepHead(n) {
  return `<p class="eyebrow">${esc(t.step(n))}</p>
    <ol class="track" aria-label="${esc(t.step(n))}">
      ${t.steps.map((s, i) => `<li${i + 1 === n ? ' aria-current="step"' : ""}${i + 1 < n ? ' class="done"' : ""}>${esc(s)}</li>`).join("")}
    </ol>`;
}

function showSignals() {
  const byGroup = GROUPS.map((g) => [g, VIBES.filter((v) => v.group === g)]);
  view.innerHTML = `<section class="panel" aria-labelledby="pick-title">
    ${stepHead(1)}
    <h1 id="pick-title">${esc(t.pickTitle)}</h1>
    <p class="lede">${esc(t.pickLede)}</p>
    <div class="board" id="board">
      ${byGroup.map(([g, list]) => `<fieldset class="group"><legend>${esc(t.groups[g])}</legend>
        ${list.map((v) => `<button type="button" class="signal" data-id="${v.id}" aria-pressed="false">${esc(v.label[locale])}</button>`).join("")}
      </fieldset>`).join("")}
    </div>
    <p class="count" id="count" aria-live="polite">${esc(t.picked(state.picks.length))}</p>
    <div class="btns"><button type="button" class="btn primary" id="next" ${state.picks.length >= 4 ? "" : "disabled"}>${esc(t.next)}</button></div>
  </section>`;

  const board = document.getElementById("board");
  const count = document.getElementById("count");
  const next = document.getElementById("next");
  for (const b of board.querySelectorAll(".signal")) {
    b.style.setProperty("--sig", signalColor(b.dataset.id));
    if (state.picks.includes(b.dataset.id)) b.setAttribute("aria-pressed", "true");
    b.addEventListener("click", () => {
      const id = b.dataset.id;
      const on = !state.picks.includes(id);
      state.picks = on ? [...state.picks, id] : state.picks.filter((x) => x !== id);
      b.setAttribute("aria-pressed", String(on));
      count.textContent = t.picked(state.picks.length);
      next.disabled = state.picks.length < 4;
      count.dataset.need = state.picks.length < 4 ? "true" : "false";
      drawMe();
    });
  }
  next.addEventListener("click", () => {
    if (state.picks.length < 4) {
      count.textContent = t.need;
      return;
    }
    showDials();
  });
  progress.textContent = t.step(1);
}

function showDials() {
  view.innerHTML = `<section class="panel" aria-labelledby="dial-title">
    ${stepHead(2)}
    <h1 id="dial-title">${esc(t.dialTitle)}</h1>
    <p class="lede">${esc(t.dialLede)}</p>
    <label class="dial">
      <span class="dial-name">${esc(t.tempoName)}</span>
      <input type="range" id="tempo" min="0" max="100" step="1" value="${state.tempo}" aria-describedby="tempo-ends">
      <span class="ends" id="tempo-ends"><span>${esc(t.tempoLow)}</span><span>${esc(t.tempoHigh)}</span></span>
    </label>
    <label class="dial">
      <span class="dial-name">${esc(t.depthName)}</span>
      <input type="range" id="depth" min="0" max="100" step="1" value="${state.depth}" aria-describedby="depth-ends">
      <span class="ends" id="depth-ends"><span>${esc(t.depthLow)}</span><span>${esc(t.depthHigh)}</span></span>
    </label>
    <div class="btns">
      <button type="button" class="btn" id="back">${esc(t.back)}</button>
      <button type="button" class="btn primary" id="find">${esc(t.find)}</button>
    </div>
  </section>`;

  const tempo = document.getElementById("tempo");
  const depth = document.getElementById("depth");
  tempo.addEventListener("input", () => { state.tempo = Number(tempo.value); drawMe(); });
  depth.addEventListener("input", () => { state.depth = Number(depth.value); drawMe(); });
  document.getElementById("back").addEventListener("click", showSignals);
  document.getElementById("find").addEventListener("click", () => {
    state.tempo = Number(tempo.value);
    state.depth = Number(depth.value);
    showMatches();
  });
  progress.textContent = t.step(2);
  tempo.focus({ preventScroll: true });
}

function showMatches() {
  const me = { picks: state.picks, tempo: state.tempo, depth: state.depth };
  const ranked = rankedMatches(SAMPLE_PROFILES, me);

  view.innerHTML = `<section class="panel" aria-labelledby="match-title">
    ${stepHead(3)}
    <h1 id="match-title">${esc(t.matchTitle)}</h1>
    <p class="lede">${esc(t.matchLede)}</p>
    <ul class="matches">
      ${ranked.map(({ profile: p, score, shared }) => `<li class="match">
        <div class="face"><canvas width="320" height="320" aria-hidden="true"></canvas><div class="avatar">${avatarSvg(p, 96)}</div></div>
        <div class="body">
          <p class="who"><strong>${esc(p.name)}</strong> <span class="pron">${esc(p.pronouns)}</span> <span class="pill">${esc(t.sample)}</span></p>
          <p class="blurb">${esc(p.blurb[locale])}</p>
          <p class="shared">${shared.length ? esc(t.shared(shared.length)) + ": " + shared.map((id) => `<span class="chip small" data-id="${id}">${esc(labelOf(id, locale))}</span>`).join(" ") : esc(t.sharedNone)}</p>
          <p class="why"><span class="score">${esc(t.score(score))}</span> <span class="dials">${esc(t.dials(p.tempo, p.depth))}</span></p>
          <button type="button" class="btn quiet hi" data-id="${p.id}">${esc(t.sayHi)}</button>
        </div>
      </li>`).join("")}
    </ul>
    <p class="born muted">${esc(t.born)}</p>
    <div class="btns">
      <button type="button" class="btn" id="back">${esc(t.back)}</button>
      <button type="button" class="btn primary" id="again">${esc(t.again)}</button>
    </div>
  </section>`;

  matchAuras.forEach((a) => a.dispose());
  matchAuras = ranked.map(({ profile }, i) => { const a = new Aura(view.querySelectorAll(".match .face canvas")[i]); a.set(profile); return a; });
  for (const c of view.querySelectorAll(".chip[data-id]")) c.style.setProperty("--sig", signalColor(c.dataset.id));
  document.getElementById("back").addEventListener("click", showDials);
  document.getElementById("again").addEventListener("click", () => {
    state.picks = [];
    state.tempo = 50;
    state.depth = 50;
    drawMe();
    showSignals();
  });
  for (const b of view.querySelectorAll(".hi")) {
    b.addEventListener("click", () => {
      const p = SAMPLE_PROFILES.find((x) => x.id === b.dataset.id);
      document.getElementById("opener-title").textContent = t.openerTitle(p.name);
      document.getElementById("opener-text").textContent = p.opener[locale];
      b.textContent = t.sent;
      b.disabled = true;
      openerDialog.showModal();
    });
  }
  progress.textContent = t.step(3);
  document.getElementById("match-title").setAttribute("tabindex", "-1");
  document.getElementById("match-title").focus({ preventScroll: true });
}

document.getElementById("opener-close").addEventListener("click", () => openerDialog.close());
drawMe();
showSignals();
mountMotion(t);
