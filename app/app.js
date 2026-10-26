// The VibeMatch vibe check: pick signals, set two dials, meet three sample people whose vibes rhyme.
// It runs in this tab only (the pages are served with connect-src 'none'), and every profile is fictional.
// The score and its two parts are the ones the about page writes down: 72% shared signals + 28% dial closeness.
// Its safety shape is the family's: an 18+ gate before the check, and report and block on every profile.
import { VIBES, GROUPS, labelOf } from "./vibes.js";
import { SAMPLE_PROFILES } from "./profiles.js";
import { avatarSvg } from "./avatar.js";
import { rankedMatches } from "./score.js";
import { M } from "./i18n.js";
import { REASONS, visibleMatches, reportMailto } from "./safety.js";

const locale = ["en", "es", "zh-Hans"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";
const t = M[locale];

const view = document.getElementById("view");
const progress = document.getElementById("progress");
const openerDialog = document.getElementById("opener-dialog");

const state = { picks: [], tempo: 50, depth: 50, intro: null, blocked: [], aged: false };
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function stepHead(n) {
  return `<p class="eyebrow">${esc(t.step(n))}</p>
    <ol class="track" aria-label="${esc(t.step(n))}">
      ${t.steps.map((s, i) => `<li${i + 1 === n ? ' aria-current="step"' : ""}${i + 1 < n ? ' class="done"' : ""}>${esc(s)}</li>`).join("")}
    </ol>`;
}

// The gate is the first thing on the page and nothing of the check exists behind it: the board is not
// drawn, so there is nothing to click past. A refusal records nothing and sends nothing.
function showGate() {
  view.innerHTML = `<section class="panel gate" aria-labelledby="gate-title">
    <h1 id="gate-title" tabindex="-1">${esc(t.gateTitle)}</h1>
    <p class="lede">${esc(t.gateLede)}</p>
    <div class="btns">
      <button type="button" class="btn primary" id="gate-yes">${esc(t.gateYes)}</button>
      <button type="button" class="btn" id="gate-no">${esc(t.gateNo)}</button>
    </div>
    <p class="muted"><a href="../about.html#safety">${esc(t.safety)}</a></p>
  </section>`;
  progress.textContent = "";
  document.getElementById("gate-yes").addEventListener("click", () => {
    state.aged = true;
    showSignals();
  });
  document.getElementById("gate-no").addEventListener("click", () => {
    view.innerHTML = `<section class="panel gate">
      <h1 id="gate-late" tabindex="-1">${esc(t.gateLate)}</h1>
      <div class="btns"><a class="btn" href="../">${esc(t.gateHome)}</a></div>
    </section>`;
    document.getElementById("gate-late").focus({ preventScroll: true });
  });
  document.getElementById("gate-title").focus({ preventScroll: true });
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
    if (state.picks.includes(b.dataset.id)) b.setAttribute("aria-pressed", "true");
    b.addEventListener("click", () => {
      const id = b.dataset.id;
      const on = !state.picks.includes(id);
      state.picks = on ? [...state.picks, id] : state.picks.filter((x) => x !== id);
      b.setAttribute("aria-pressed", String(on));
      count.textContent = t.picked(state.picks.length);
      next.disabled = state.picks.length < 4;
      count.dataset.need = state.picks.length < 4 ? "true" : "false";
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
  tempo.addEventListener("input", () => { state.tempo = Number(tempo.value); });
  depth.addEventListener("input", () => { state.depth = Number(depth.value); });
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
  const shown = visibleMatches(ranked, state.blocked);
  const blocked = ranked.map(({ profile }) => profile).filter((p) => state.blocked.includes(p.id));

  view.innerHTML = `<section class="panel" aria-labelledby="match-title">
    ${stepHead(3)}
    <h1 id="match-title">${esc(t.matchTitle)}</h1>
    <p class="lede">${esc(t.matchLede)}</p>
    ${shown.length ? `<ul class="matches">
      ${shown.map(({ profile: p, score, shared }) => `<li class="match">
        <div class="face">${avatarSvg(p, 96)}</div>
        <div class="body">
          <p class="who"><strong>${esc(p.name)}</strong> <span class="pron">${esc(p.pronouns)}</span> <span class="pill">${esc(t.sample)}</span></p>
          <p class="blurb">${esc(p.blurb[locale])}</p>
          <p class="shared">${shared.length ? esc(t.shared(shared.length)) + ": " + shared.map((id) => `<span class="chip small">${esc(labelOf(id, locale))}</span>`).join(" ") : esc(t.sharedNone)}</p>
          <p class="why"><span class="score">${esc(t.score(score))}</span> <span class="dials">${esc(t.dials(p.tempo, p.depth))}</span></p>
          <div class="acts">
            <button type="button" class="btn quiet hi" data-id="${p.id}">${esc(t.sayHi)}</button>
            <button type="button" class="btn quiet report" data-id="${p.id}">${esc(t.report)}</button>
            <button type="button" class="btn quiet block" data-id="${p.id}">${esc(t.block)}</button>
          </div>
        </div>
      </li>`).join("")}
    </ul>` : `<p class="notice" id="all-blocked">${esc(t.allBlocked)}</p>`}
    ${blocked.length ? `<section class="blocked" aria-labelledby="blocked-title">
      <h2 id="blocked-title">${esc(t.blockedTitle(blocked.length))}</h2>
      <p class="muted">${esc(t.blockedNote)}</p>
      <ul class="blocked-list">
        ${blocked.map((p) => `<li><span>${esc(p.name)}</span> <button type="button" class="btn quiet unblock" data-id="${p.id}">${esc(t.unblock)}</button></li>`).join("")}
      </ul>
    </section>` : ""}
    <p class="born muted">${esc(t.born)}</p>
    <div class="btns">
      <button type="button" class="btn" id="back">${esc(t.back)}</button>
      <button type="button" class="btn primary" id="again">${esc(t.again)}</button>
    </div>
  </section>`;

  document.getElementById("back").addEventListener("click", showDials);
  document.getElementById("again").addEventListener("click", () => {
    state.picks = [];
    state.tempo = 50;
    state.depth = 50;
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
  for (const b of view.querySelectorAll(".report")) {
    b.addEventListener("click", () => openReport(SAMPLE_PROFILES.find((x) => x.id === b.dataset.id)));
  }
  for (const b of view.querySelectorAll(".block")) {
    b.addEventListener("click", () => {
      if (!state.blocked.includes(b.dataset.id)) state.blocked = [...state.blocked, b.dataset.id];
      showMatches();
    });
  }
  for (const b of view.querySelectorAll(".unblock")) {
    b.addEventListener("click", () => {
      state.blocked = state.blocked.filter((id) => id !== b.dataset.id);
      showMatches();
    });
  }
  progress.textContent = t.step(3);
  document.getElementById("match-title").setAttribute("tabindex", "-1");
  document.getElementById("match-title").focus({ preventScroll: true });
}

// The report dialog: the page cannot call anywhere, so it writes the report and hands it to the visitor's
// own mail app. Nothing is sent until they send it, and the dialog says where the report goes.
const reportDialog = document.createElement("dialog");
reportDialog.id = "report-dialog";
reportDialog.setAttribute("aria-labelledby", "report-title");
document.body.appendChild(reportDialog);

function openReport(profile) {
  reportDialog.innerHTML = `<h2 id="report-title"></h2>
    <p class="muted">${esc(t.reportLede)}</p>
    <label class="field"><span>${esc(t.reportReason)}</span>
      <select id="report-reason">${REASONS.map((r) => `<option value="${r}">${esc(t.reasons[r])}</option>`).join("")}</select>
    </label>
    <label class="field"><span>${esc(t.reportNote)}</span>
      <textarea id="report-note" rows="3"></textarea>
    </label>
    <div class="btns">
      <button type="button" class="btn" id="report-close">${esc(t.reportClose)}</button>
      <a class="btn primary" id="report-send" href="#"></a>
    </div>`;
  document.getElementById("report-title").textContent = t.reportTitle(profile.name);
  const reason = document.getElementById("report-reason");
  const note = document.getElementById("report-note");
  const send = document.getElementById("report-send");
  send.textContent = t.reportSend;
  const sync = () => {
    try {
      send.href = reportMailto({ profile, reason: reason.value, reasonLabel: t.reasons[reason.value], note: note.value, page: location.href });
    } catch {
      send.removeAttribute("href");
    }
  };
  reason.addEventListener("change", sync);
  note.addEventListener("input", sync);
  document.getElementById("report-close").addEventListener("click", () => reportDialog.close());
  sync();
  reportDialog.showModal();
  reason.focus();
}

document.getElementById("opener-close").addEventListener("click", () => openerDialog.close());
if (state.aged) showSignals();
else showGate();
