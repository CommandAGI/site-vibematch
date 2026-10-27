# VibeMatch, after hours: the design

*The designer: a music and nightlife designer — club flyers, record sleeves, festival bills. Brief: each person is an
aura generated from their vibe, not a bio (docs/design/startup-redesign-2027.md § 4).*

## concept

A night out seen as light. You never see a face first: you see a glow made of your answers, and other glows drifting
toward it across the grooves of a record. The page is a flyer at full bleed: huge lowercase type over moving haze, a
bill line of what is on tonight, a door policy, a guest list.

## type

- **Syne** (display, variable 400–800): 800 for headlines, set lowercase, tracked −0.045 to −0.055 em, line-height
  0.84–0.95. 600–700 uppercase at +0.16–0.2 em for labels, the bill and the nav rail. Outline numerals
  (`-webkit-text-stroke`) for steps, liner-note numbers and the second part of the score.
- **Atkinson Hyperlegible Next** (text, variable 200–800): body at 17 px / 1.55, `text-wrap: pretty`.
- Scale: 1.333 from 17 px for text; display sizes follow the viewport (`clamp`), the hero line up to 13.5 rem.
- Numerals: tabular everywhere (`font-variant-numeric: tabular-nums`).
- Both fonts self-hosted, subset to Latin + Latin-1 + punctuation (32 KB each, woff2), metric-adjusted fallbacks
  (Arial Black / Verdana). zh-Hans text falls back to PingFang SC / Noto Sans SC.

## colour (OKLCH, sRGB fallback first; contrast measured on night)

| token | OKLCH | sRGB | contrast on night |
|---|---|---|---|
| night | 0.15 0.012 300 | #0c0a10 | — |
| night-2 | 0.20 0.016 300 | #17141c | — |
| white | 0.97 0.006 300 | #f6f4f9 | 18.0 : 1 |
| dim | 0.76 0.02 300 | #b3aebc | 9.1 : 1 |
| faint | 0.60 0.02 300 | #827e8b | 5.0 : 1 (AA for text) |
| coral (tempo, strikes, focus ring) | 0.72 0.19 30 | #ff6c58 | 7.1 : 1 |
| lime (taste, primary hover, current step) | 0.90 0.18 118 | #d4ed4f | 15.1 : 1 |
| magenta (people, selection) | 0.70 0.24 342 | #fa4dc7 | 6.5 : 1 |
| cyan (mode, "said out loud") | 0.84 0.13 205 | #40e2f3 | 12.6 : 1 |

The aura palette is generated: each signal takes its group's hue ±13° (tempo 32°, taste 118°, people 342°, mode
205°) at L 0.74, C 0.19, converted to sRGB in `app/aura.js` so every browser draws it. Dark only.

## shape and layout

- **The ellipse** is the only rounded shape: buttons (`border-radius: 50%`), tags, the locale pill, the motion switch,
  the auras and the record's grooves. Everything else is square-cut, ruled with 1 px hairlines. No cards, no shadows.
- **Nav**: a vertical rail on the right edge (≥ 900 px), labels set sideways, a dot per link, the current page's dot
  lit lime. Below 900 px: a "Menu" button with an ellipse glyph opens a full-screen popover with the links set huge.
  Without popover support the links show inline.
- 2560 / 1440: hero type spans the width, the mixer is three columns (setlist · field · faders). 768: field on top,
  setlist and vertical faders beside each other. 390: one column, the field full width, faders horizontal with their
  ends left and right, sample names without the "sample" second line (the aria-label and legend keep it).
  320: the same, the hero line at 3.1 rem, the bill wrapping onto three lines.

## motion: drift and bloom

Light in haze: slow (0.9–1.8 s), eased with `cubic-bezier(0.37, 0, 0.18, 1)`, opacity, blur and scale; nothing snaps.
- An aura blooms from its old glows into its new ones in 0.9 s; glows wobble at a speed set by the tempo dial.
- Sample auras drift along the radius in 1.8 s: score 100 sits beside you, score 0 on the rim.
- Scroll-driven (`animation-timeline`, where supported): the hero line loosens and fades as you leave it, the door
  policy's coral strikes draw across each word, the score's numerals tighten into place, headings rise out of blur.
- Grain: an SVG noise tile stepping at 6 frames in 0.9 s, 11 % opacity (never a flash: it is a texture shift, not a
  luminance change).
- **Reduced motion**: no loop plays (the poster frames stay), auras draw once without drift, no grain movement, no
  scroll scenes (everything shows in its end state). **The motion switch** (footer / app header) does the same for
  anyone, for the visit.

## media plan (fal, `redesign/media.mjs`; cost in NOTES.md)

Three 10 s clips from Kling 2.5 Turbo Pro, 16:9, no people, no text; graded to the night (crushed blacks, each pushed
to its section's light), cut to seamless 8 s loops (the last 2 s dissolve into the first), 1280 px, 24 fps, AV1 +
H.264, muted, posters from the loop's first frame.
- **auras** (hero): two clouds of coral and cyan haze drift together and mix — the product's idea in one shot.
- **record** (how it works): a record spinning under one tungsten light, violet in the shadows.
- **rain** (early access): rain on a night window, magenta/amber/teal bokeh behind.
The hero loop preloads; the others load only near the screen.

## the signature moment

"01 make an aura": tap signals in the setlist; each lights in its hue and your aura blooms in the middle of a record's
grooves; the eight sample people, each an aura, drift in or out along the grooves by the vibe check's own score. The
readout says who drifted closest and which signals you share, in words — never a personality score. Tap a sample to
hear about that one. "Take the vibe check" carries your answers into the app in the address (nothing stored).

## sections

hero (auras loop) → 01 make an aura → how matching works (record loop) → 02 the door policy → 03 the score
(72 + 28, one reading, not a verdict) → early access (rain loop) → footer (the wordmark at full width).
The app: one step at a time on the left, your aura on the right (a band above the step on phones); matches as rows,
each a sample's aura with the drawn avatar inside. About: liner notes, one numbered row per section.

## identity

The wordmark is Syne 800 outlines (`redesign/wordmark.py`), kerned tight by hand, with the i's dot replaced by a small
aura of coral and cyan. The favicon and touch icon are that aura alone on night. The OG card (`og.png`,
`redesign/cards.py`) is the hero's poster with "you need a vibe."

## don'ts

No faces in any generated image, no stock nightlife, no crowd. No percentages beyond the vibe check's own score. No
gradient text, no glass, no glow borders, no rounded rectangles. No countdowns or "spots left" on early access.
