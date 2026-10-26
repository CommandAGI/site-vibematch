#!/usr/bin/env node
// The main flow, from a blank visit, in a real browser: the landing page, the vibe check (five signals, two
// dials, three matches, an intro), and the A/文 picker into each locale. No page error, no console error, and
// nothing loaded from anywhere but this site. It serves the folder itself, or takes a live address:
//
//   node tests/journey.mjs                              the folder, served here
//   node tests/journey.mjs --url https://vibematch.commandagi.app
//
// Chrome (CHROME_PATH picks the binary). It writes a screenshot of the matches and of each locale to
// tests/.out/ so a person can check the picture (a dot folder, so it is never served), and exits 1 at the first thing that does not hold.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = path.join(root, "tests", ".out");
const live = process.argv.includes("--url") ? process.argv[process.argv.indexOf("--url") + 1] : null;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (page, expression, ms = 15000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await page.eval(`!!(${expression})`).catch(() => false)) return;
    await sleep(100);
  }
  throw Error(`timed out waiting for ${expression}`);
};

async function serve() {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(root, url);
    if (url.endsWith("/")) file = path.join(file, "index.html");
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

async function chrome(profile) {
  const bin = process.env.CHROME_PATH ?? "google-chrome";
  const child = spawn(bin, ["--headless=new", "--no-sandbox", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--window-size=1280,900",
    // The browser uses the machine's own resolver: DNS-over-HTTPS is a third party this sandboxed run cannot reach.
    "--disable-features=DnsOverHttps", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const ws = await new Promise((resolve, reject) => {
    let seen = "";
    const timer = setTimeout(() => reject(Error(`chrome did not open its DevTools socket: ${seen.slice(-800)}`)), 60000);
    child.stderr.on("data", (d) => { seen += d; const m = /DevTools listening on (ws:\/\/\S+)/.exec(seen); if (m) { clearTimeout(timer); resolve(m[1]); } });
    child.on("exit", (code) => { clearTimeout(timer); reject(Error(`chrome exited ${code}: ${seen.slice(-800)}`)); });
  });
  return { child, ws };
}

async function devtools(browserWs) {
  const browser = new WebSocket(browserWs);
  await new Promise((r) => browser.addEventListener("open", r, { once: true }));
  let seq = 0;
  const pending = new Map(), listeners = [];
  browser.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(Error(m.error.message)) : resolve(m.result); }
    else for (const l of listeners) l(m);
  });
  const raw = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); browser.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const { targetId } = await raw("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await raw("Target.attachToTarget", { targetId, flatten: true });
  const send = (method, params) => raw(method, params, sessionId);
  const errors = [], consoleErrors = [], requests = [], blocked = [], responses = [], urls = new Map();
  listeners.push((m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails?.exception?.description ?? m.params.exceptionDetails?.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
    if (m.method === "Network.requestWillBeSent") { requests.push(m.params.request.url); urls.set(m.params.requestId, m.params.request.url); }
    if (m.method === "Network.loadingFailed" && m.params.blockedReason === "csp") blocked.push(urls.get(m.params.requestId));
    if (m.method === "Network.responseReceived") responses.push(m.params.response.url);
  });
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const page = {
    errors, consoleErrors, requests, blocked, responses,
    // A navigation is done when its own load event fires: the old document answers readyState while the new one
    // commits. A navigation that raced another one shows Chrome's error page; that one is tried once more.
    async goto(url) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const loaded = new Promise((r) => { listeners.push((m) => { if (m.sessionId === sessionId && m.method === "Page.loadEventFired") r(); }); });
        await send("Page.navigate", { url });
        await Promise.race([loaded, sleep(20000)]);
        const href = await page.eval("location.href").catch(() => "");
        if (!href.startsWith("chrome-error:")) break;
        await sleep(500);
      }
      await waitFor(page, 'document.readyState === "complete"');
      await sleep(200);
    },
    async eval(expression) { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; },
    async click(expression) { const ok = await page.eval(`(() => { const el = ${expression}; if (!el) return false; el.click(); return true; })()`); if (!ok) throw Error(`nothing to click for ${expression}`); await sleep(120); },
    async shot(name) { const r = await send("Page.captureScreenshot", { format: "png" }); await writeFile(path.join(out, name), Buffer.from(r.data, "base64")); },
    close() { browser.close(); },
  };
  return page;
}

const check = (cond, message) => { if (!cond) throw Error(message); };

/** Wait for the signal board, and say what the page was if it never came. */
const signalsUp = async (page, where) => {
  try {
    await waitFor(page, 'document.querySelectorAll(".signal").length === 16');
  } catch (e) {
    const state = await page.eval('JSON.stringify({ href: location.href, lang: document.documentElement.lang, signals: document.querySelectorAll(".signal").length, ready: document.readyState })').catch(() => "(no answer)");
    console.error(`${where}: ${state} errors=${JSON.stringify(page.errors)} console=${JSON.stringify(page.consoleErrors)}`);
    throw e;
  }
};

const { server, url } = live ? { server: null, url: live } : await serve();
const profile = await mkdtemp(path.join(tmpdir(), "vibematch-chrome-"));
const { child, ws } = await chrome(profile);
const page = await devtools(ws);
try {
  await mkdir(out, { recursive: true });

  // 1. A blank visit lands on the landing page.
  await page.goto(url);
  check(await page.eval("document.documentElement.lang") === "en", "the landing page is English");
  check((await page.eval("document.querySelector('h1').textContent")).includes("vibe"), "the landing page has its headline");
  await page.shot("01-landing.png");

  // 2. The main flow: the vibe check, through the visible controls.
  await page.click("[...document.querySelectorAll('a')].find(a => a.textContent.includes('vibe check'))");
  await signalsUp(page, "main flow");
  check(await page.eval('location.pathname.replace(/\\/$/, "")').then((p) => p.endsWith("/app")), "the vibe check is open");
  for (const id of ["slow-sunday", "bookshop", "one-to-one", "talk-ideas", "make-things"])
    await page.click(`document.querySelector('.signal[data-id="${id}"]')`);
  check(await page.eval('document.querySelectorAll(\'.signal[aria-pressed="true"]\').length') === 5, "five signals chosen");
  await page.click('document.getElementById("next")');
  await waitFor(page, 'document.querySelectorAll(".dial input").length === 2');
  await page.eval(`(() => { const t = document.getElementById("tempo"), d = document.getElementById("depth");
    t.value = 30; t.dispatchEvent(new Event("input")); d.value = 80; d.dispatchEvent(new Event("input")); return true; })()`);
  await page.click('document.getElementById("find")');
  await waitFor(page, 'document.querySelectorAll(".match").length === 3');
  const scores = await page.eval('[...document.querySelectorAll(".match .score")].map(e => parseInt(e.textContent, 10))');
  check(scores.length === 3 && scores.every((n) => n >= 0 && n <= 100), `three scores, each 0-100: ${scores}`);
  check(scores[0] >= scores[1] && scores[1] >= scores[2], `the matches are ranked: ${scores}`);
  check((await page.eval('document.querySelector(".match .shared").textContent')).includes(":"), "each match names the signals it shares");
  await page.shot("02-matches.png");

  // 3. An intro is written, and says it is only a demo.
  await page.click('document.querySelector(".match .hi")');
  await waitFor(page, 'document.getElementById("opener-dialog").open');
  check((await page.eval('document.getElementById("opener-text").textContent')).length > 20, "the intro has words");
  check((await page.eval('document.getElementById("opener-dialog").textContent')).includes("demo") || (await page.eval('document.getElementById("opener-dialog").textContent')).includes("Demo"), "the intro says it is a demo");
  await page.shot("03-intro.png");
  await page.click('document.getElementById("opener-close")');

  // 4. The A/文 picker reaches the same page in each locale, and the app speaks that locale.
  for (const [locale, prefix, pageWord, appWord] of [
    ["es", "es/", "No necesitas una biografía", "¿Qué se siente"],
    ["zh-Hans", "zh-Hans/", "你不需要一份简介", "什么感觉像你"],
  ]) {
    await page.goto(url);
    await page.eval(`document.querySelector('.locale summary').click()`);
    await page.click(`document.querySelector('.locale .menu a[lang="${locale}"]')`);
    // The click's own navigation settles before the next one starts: a navigation issued over a live one is aborted.
    await waitFor(page, `document.readyState === "complete" && document.documentElement.lang === "${locale}" && location.pathname.startsWith("/${prefix.replace(/\/$/, "")}/")`);
    await sleep(300);
    check((await page.eval("document.body.textContent")).includes(pageWord), `the ${locale} page is in ${locale}`);
    await page.click('document.querySelector(\'.site-nav a[href$="app/"]\')');
    await signalsUp(page, `${locale} app`);
    check((await page.eval("document.body.textContent")).includes(appWord), `the ${locale} vibe check is in ${locale}`);
    await page.shot(`04-${locale}-app.png`);
  }

  // 5. Nothing loaded from anywhere else, and nothing failed.
  // A request the page's own policy blocked is not a load; a response from elsewhere would be.
  const foreign = page.requests.filter((u) => !u.startsWith(url) && !u.startsWith("data:") && u !== "about:blank" && !page.blocked.includes(u));
  check(foreign.length === 0, `nothing requested from elsewhere: ${foreign}`);
  const loaded = page.responses.filter((u) => !u.startsWith(url) && !u.startsWith("data:"));
  check(loaded.length === 0, `nothing served from elsewhere: ${loaded}`);
  check(page.errors.length === 0, `no page error: ${page.errors}`);
  check(page.consoleErrors.length === 0, `no console error: ${page.consoleErrors}`);

  console.log(`ok: ${url} — the landing page, the vibe check (5 signals, 3 ranked matches, an intro), es and zh-Hans, no page or console error, ${page.requests.length} requests, all on site.`);
  console.log(`screenshots: ${out}`);
} finally {
  page.close();
  child.kill("SIGTERM");
  if (server) server.close();
  await rm(profile, { recursive: true, force: true });
}
