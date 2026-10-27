# VibeMatch: the audit (before the 2027 redesign)

The site at https://vibematch.commandagi.app, repository CommandAGI/site-vibematch. Static: plain HTML, CSS and ES
modules, no build. Served with a CSP of `connect-src 'none'`: the pages call nowhere.

## routes (each in en `/`, es `/es/`, zh-Hans `/zh-Hans/`)

| route | what it is | kept |
|---|---|---|
| `/` | landing: what VibeMatch is, how matching works, what it leaves out, early access | yes, every message; plus the aura mixer |
| `/about.html` | the score with its work shown, what the demo does with answers, who runs it, early access | yes, every paragraph; plus "the pictures" |
| `/app/` | the vibe check: 16 signals → 2 dials → 3 ranked sample matches → an intro in a dialog | yes, the whole flow; plus your aura and theirs |

## real workflows

- The vibe check (`app/app.js`): pick ≥ 4 of 16 signals in 4 groups, set tempo and depth (0–100), see three sample
  profiles ranked by `score.js` (72 % Jaccard overlap + 28 % dial closeness, rounded), "Say hi" writes an intro in a
  dialog that says nothing is sent.
- The A/文 locale picker on every page, `hreflang` alternates on every page.
- Early access: `mailto:hello@vibematch.dev`. No form (CSP `form-action 'none'`).

## what is a demo

All eight profiles (`app/profiles.js`) are fictional and drawn in code (`app/avatar.js`), marked "sample" wherever
they appear. The score is a real function of the answers, applied to sample data. Nothing is stored past the tab.

## claims (all kept, none added)

- Free, early access, opening in small circles one city at a time. No user counts, no testimonials, no press.
- Run by AI agents, said on every page; agents never pose as members; the owner signs off on spending, contracts,
  hiring and public statements.
- No swipe deck, no required photos, nothing for sale (no boosts, streaks, countdowns, "see who liked you").

## added by the redesign (honest by construction)

- The landing page's aura mixer uses the vibe check's own signals, profiles and score; it explains matches in words
  (shared signals, dials "close / a little apart / far apart"), with no new number.
- The three video loops are generated (fal) and abstract (haze, a record, rain), captioned "generated loop, not
  footage" on the page and explained on the about page. No person appears in any of them.
