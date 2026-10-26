// The site's own test: the files, the three locales, every link, the signal board and the score.
// Run: node --test tests/site.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VIBES, GROUPS } from "../app/vibes.js";
import { SAMPLE_PROFILES } from "../app/profiles.js";
import { scoreOf } from "../app/score.js";
import { M } from "../app/i18n.js";
import { REASONS, visibleMatches, reportMailto } from "../app/safety.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const LOCALES = { en: "", es: "es/", "zh-Hans": "zh-Hans/" };
const PAGES = ["index.html", "about.html", "app/index.html"];
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("site.json names the site and its domain", () => {
  const site = JSON.parse(read("site.json"));
  assert.equal(site.slug, "vibematch");
  assert.equal(site.status, "active");
  assert.ok(site.description.length > 40);
  assert.deepEqual(site.domains, ["vibematch.dev"]);
});

test("every page exists in en, es and zh-Hans, with the right lang and the A/文 picker", () => {
  for (const [locale, prefix] of Object.entries(LOCALES)) {
    for (const page of PAGES) {
      const rel = join(prefix, page);
      assert.ok(existsSync(join(root, rel)), `${rel} exists`);
      const html = read(rel);
      assert.match(html, new RegExp(`<html lang="${locale}">`), `${rel}: lang`);
      assert.match(html, /class="locale"/, `${rel}: the A/文 picker`);
      assert.match(html, /A\/文/, `${rel}: the A\/文 glyph`);
      for (const other of Object.keys(LOCALES))
        assert.match(html, new RegExp(`hreflang="${other}"`), `${rel}: hreflang ${other}`);
      assert.match(html, /hreflang="x-default"/, `${rel}: x-default`);
      assert.match(html, /connect-src 'none'/, `${rel}: the page cannot call out`);
    }
  }
});

test("the A/文 picker reaches the same page in the other two locales", () => {
  for (const [locale, prefix] of Object.entries(LOCALES)) {
    for (const page of PAGES) {
      const rel = join(prefix, page);
      const html = read(rel);
      const menu = html.slice(html.indexOf('<nav class="menu"'), html.indexOf("</nav>", html.indexOf('<nav class="menu"')));
      const links = [...menu.matchAll(/href="([^"]+)"/g)].map((m) => resolve(dirname(join(root, rel)), m[1]));
      const reaches = (want) => links.some((t) => t === want || resolve(t, "index.html") === want);
      for (const [other, otherPrefix] of Object.entries(LOCALES)) {
        const want = resolve(root, otherPrefix, page);
        assert.ok(reaches(want), `${rel}: the menu links to ${other} (${want})`);
      }
    }
  }
});

test("every relative link and image resolves to a file", () => {
  for (const prefix of Object.values(LOCALES)) {
    for (const page of PAGES) {
      const rel = join(prefix, page);
      const html = read(rel);
      for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (/^(?:https?:|mailto:|#)/.test(href)) continue;
        const url = href.split("#")[0];
        const target = resolve(dirname(join(root, rel)), url);
        const exists = existsSync(target) || existsSync(join(target, "index.html"));
        assert.ok(exists, `${rel}: ${url} resolves`);
      }
    }
  }
});

test("the signal board is sixteen signals in four groups, each named in all three locales", () => {
  assert.equal(VIBES.length, 16);
  assert.equal(new Set(VIBES.map((v) => v.id)).size, 16);
  for (const group of GROUPS) assert.equal(VIBES.filter((v) => v.group === group).length, 4, group);
  for (const v of VIBES) for (const locale of Object.keys(LOCALES)) assert.ok(v.label[locale], `${v.id}: ${locale}`);
});

test("the sample profiles are complete fictional people, drawn in code", () => {
  assert.equal(SAMPLE_PROFILES.length, 8);
  const ids = new Set(VIBES.map((v) => v.id));
  for (const p of SAMPLE_PROFILES) {
    assert.ok(p.name && p.pronouns, p.id);
    assert.ok(p.picks.length >= 4 && p.picks.every((id) => ids.has(id)), `${p.id}: real picks`);
    for (const dial of ["tempo", "depth"]) assert.ok(p[dial] >= 0 && p[dial] <= 100, `${p.id}: ${dial}`);
    for (const locale of Object.keys(LOCALES)) {
      assert.ok(p.blurb[locale], `${p.id}: blurb ${locale}`);
      assert.ok(p.opener[locale], `${p.id}: opener ${locale}`);
    }
    assert.ok(p.look.bg && p.look.skin && p.look.hair && p.look.style && p.look.top, `${p.id}: an avatar`);
  }
});

test("the score is 72% shared signals + 28% dial closeness, as the about page says", () => {
  const me = { picks: ["slow-sunday", "bookshop", "one-to-one", "talk-ideas"], tempo: 0, depth: 100 };
  const twin = { picks: [...me.picks], tempo: 0, depth: 100 };
  assert.equal(scoreOf(twin, me).score, 100, "a twin scores 100");

  const opposite = { picks: ["dance-floor", "crowd", "big-table", "city-pace", "go-outside"], tempo: 100, depth: 0 };
  assert.equal(scoreOf(opposite, me).score, 0, "nothing shared and the dials apart scores 0");

  // Ten signals between them, two shared: overlap 2/8. Dial distance 20 + 20 = 40, so closeness 0.8.
  // 100 × (0.72 × 0.25 + 0.28 × 0.8) = 100 × 0.404 = 40.
  const partial = { picks: ["slow-sunday", "talk-ideas", "dance-floor", "crowd", "late-drive", "stay-in"], tempo: 20, depth: 80 };
  const got = scoreOf(partial, me);
  assert.deepEqual(got.shared.sort(), ["slow-sunday", "talk-ideas"]);
  assert.equal(got.overlap, 0.25);
  assert.equal(got.score, 40);
});

test("every string the vibe check draws is in all three locales, the gate and the safety controls included", () => {
  const en = M.en;
  for (const locale of Object.keys(LOCALES)) {
    const m = M[locale];
    assert.deepEqual(Object.keys(m).sort(), Object.keys(en).sort(), `${locale}: the same strings as English`);
    for (const [key, value] of Object.entries(m)) {
      if (typeof value === "function") continue;
      if (typeof value === "string") {
        assert.ok(value.trim(), `${locale}.${key} has words`);
        continue;
      }
      assert.deepEqual(Object.keys(value).sort(), Object.keys(en[key]).sort(), `${locale}.${key}: the same keys`);
    }
    assert.deepEqual(Object.keys(m.reasons).sort(), [...REASONS].sort(), `${locale}: a word for every report reason`);
    for (const reason of REASONS) assert.ok(m.reasons[reason].trim(), `${locale}: ${reason} has a word`);
    for (const key of ["gateTitle", "gateLede", "gateYes", "gateNo", "gateLate", "report", "block", "unblock", "blockedNote"])
      assert.ok(m[key], `${locale}.${key}`);
    assert.ok(m.reportTitle("Ana").includes("Ana"), `${locale}: the report names the person`);
    assert.ok(m.blockedTitle(2).includes("2"), `${locale}: the blocked list counts`);
  }
});

test("the site says 18 and older, report and block, and where a report goes, in all three locales", () => {
  const words = {
    en: ["18", "Report", "Block", "24"],
    es: ["18", "Denunciar", "Bloquear", "24"],
    "zh-Hans": ["18", "举报", "屏蔽", "24"],
  };
  for (const [locale, prefix] of Object.entries(LOCALES)) {
    const about = read(join(prefix, "about.html"));
    const at = about.indexOf('id="safety"');
    assert.ok(at > -1, `${locale}: the safety section`);
    const nextHeading = about.indexOf("<h2", at);
    const safety = about.slice(at, nextHeading > -1 ? nextHeading : undefined);
    assert.ok(safety.includes("hello@vibematch.dev"), `${locale}: the queue's address`);
    for (const word of words[locale]) assert.ok(safety.includes(word), `${locale}: the safety section says ${word}`);

    const home = read(join(prefix, "index.html"));
    assert.match(home, /18\s*\+|18 岁|18 años/, `${locale}: the landing page names the age`);
    assert.ok(home.includes('href="about.html#safety"'), `${locale}: the landing page reaches the safety section`);
  }
});

test("a block hides only that profile, and a report names the profile, the reason and the note", () => {
  const ranked = SAMPLE_PROFILES.slice(0, 3).map((profile, i) => ({ profile, score: 90 - i, shared: [] }));
  const [first, second] = ranked;

  assert.deepEqual(
    visibleMatches(ranked, [first.profile.id]).map((r) => r.profile.id),
    ranked.slice(1).map((r) => r.profile.id),
    "the blocked one is gone and the others stay",
  );
  assert.equal(visibleMatches(ranked, []).length, 3, "no block shows every match");
  assert.equal(visibleMatches(ranked, ranked.map((r) => r.profile.id)).length, 0, "every block hides every match");

  const href = reportMailto({ profile: second.profile, reason: "harassment", reasonLabel: "Harassment or bullying", note: "said something cruel" });
  assert.ok(href.startsWith("mailto:hello@vibematch.dev?"), href);
  const body = decodeURIComponent(href.slice(href.indexOf("&body=") + 6));
  assert.ok(decodeURIComponent(href).includes(second.profile.id), "the report names the profile");
  assert.ok(body.includes("Harassment or bullying"), "the report names the reason");
  assert.ok(body.includes("said something cruel"), "the report carries the note");
  assert.ok(body.includes("24 hours"), "the report says when a person reviews it");
  assert.throws(() => reportMailto({ profile: second.profile, reason: "rude" }), /unknown report reason/, "a reason outside the list is refused");
});
