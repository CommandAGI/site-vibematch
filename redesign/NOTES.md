# NOTES: generated media, costs, scores

## fal (2026-10-26)

Model `fal-ai/kling-video/v2.5-turbo/pro/text-to-video`, $0.07 per second (fal's pricing API), 10 s, 16:9,
`cfg_scale` 0.5, negative prompt "people, person, face, hands, crowd, text, letters, logo, watermark, signage, blur
artifacts". One take each, no retries. **Total: 3 × $0.70 = $2.10** (budget $15).

| clip | prompt |
|---|---|
| auras | Total darkness. Two soft luminous clouds of colored haze, one warm coral-magenta and one cool cyan-lime, drift slowly toward each other from opposite sides of the frame and blend where they meet into a new color. Volumetric light in smoke, 35mm film grain, slow and hypnotic, abstract. Locked-off camera. No people, no text. |
| record | Macro shot in a dark room: a black vinyl record spins slowly on a turntable, one warm tungsten light rakes across its grooves, iridescent violet and amber reflections ride the grooves, shallow depth of field, 35mm film grain, slow. No people, no label text. |
| rain | Night. Rain on a window glass, out-of-focus city lights behind it in magenta, amber and teal bokeh, droplets slowly run down the glass, 35mm film grain, slow, moody, intimate. No people, no text, no signs. |

Encoded sizes (8 s loops, 1280 px): auras 0.59 MB AV1 / 0.83 MB H.264; record 0.28 / 0.39; rain 0.49 / 0.69.
Re-make: `COMMANDAGI_ENV_ROOT=… node redesign/media.mjs generate` (costs money), then
`FFMPEG=<an ffmpeg with libaom and libx264> node redesign/media.mjs encode`. The raw clips stay in the gitignored
`redesign/.raw/`.

## other tools

- `redesign/wordmark.py <Syne[wght].ttf>`: the wordmark (fontTools).
- `redesign/cards.py`: `og.png` and `touch-icon.png` (Playwright).
- `redesign/shots.py [url|-] [out]`: screenshots at 1440 / 768 / 390 / 320 and reduced motion → `tests/.out/shots/`.

## self-scores (1-10, from the screenshots, after the second pass)

| | score | why |
|---|---|---|
| art direction | 8 | one idea (light in haze) across video, auras, grain and type; three graded loops of one family |
| brand specificity | 9 | lowercase Syne 800 flyer type, the ellipse, the rail, the grooves: no other site of the set has these |
| product expression | 8 | the mixer is the product working on the landing page, with the real score and real sample data |
| interaction | 8 | signals, faders and sample auras answer in place; keyboard-reachable buttons and ranges; aria-live readout |
| technical quality | 8 | ~25 KB of JS, two 32 KB fonts, poster-first video, CSP unchanged in spirit (`connect-src 'none'`) |
| craft | 7 | the 768 mixer leaves space beside the faders; the about page's outline numerals are thin at 390 |

Average 8.0, nothing below 7.
