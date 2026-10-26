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
      for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (/^(?:https?:|mailto:|#)/.test(url)) continue;
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
