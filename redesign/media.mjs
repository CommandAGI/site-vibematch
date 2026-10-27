#!/usr/bin/env node
// The site's generated media, made at build time and never in a page: fal renders each clip, ffmpeg encodes it
// (AV1 + H.264 fallback, muted, under ~3 MB) and draws its poster. The key is read from the .env cascade at
// COMMANDAGI_ENV_ROOT and is never printed. Every prompt, model and cost is in redesign/NOTES.md.
//
//   COMMANDAGI_ENV_ROOT=… node redesign/media.mjs generate [name…]   fal → redesign/.raw/<name>.mp4 (costs money)
//   FFMPEG=… node redesign/media.mjs encode [name…]                   redesign/.raw → media/<name>.{av1,h264}.mp4, .jpg
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const raw = join(root, "redesign", ".raw");
const media = join(root, "media");
const MODEL = "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";
const NEGATIVE = "people, person, face, hands, crowd, text, letters, logo, watermark, signage, blur artifacts";

export const CLIPS = {
  auras: "Total darkness. Two soft luminous clouds of colored haze, one warm coral-magenta and one cool cyan-lime, drift slowly toward each other from opposite sides of the frame and blend where they meet into a new color. Volumetric light in smoke, 35mm film grain, slow and hypnotic, abstract. Locked-off camera. No people, no text.",
  record: "Macro shot in a dark room: a black vinyl record spins slowly on a turntable, one warm tungsten light rakes across its grooves, iridescent violet and amber reflections ride the grooves, shallow depth of field, 35mm film grain, slow. No people, no label text.",
  rain: "Night. Rain on a window glass, out-of-focus city lights behind it in magenta, amber and teal bokeh, droplets slowly run down the glass, 35mm film grain, slow, moody, intimate. No people, no text, no signs.",
};

function falKey() {
  const dir = process.env.COMMANDAGI_ENV_ROOT;
  if (!dir) throw Error("COMMANDAGI_ENV_ROOT names the folder of the .env cascade");
  for (const f of [".env.api", ".env"]) {
    const p = join(dir, f);
    if (!existsSync(p)) continue;
    const m = /^SVC__FAL__MAIN__API_KEY=(.*)$/m.exec(readFileSync(p, "utf8"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw Error("SVC__FAL__MAIN__API_KEY is not in the cascade");
}

async function generate(name) {
  const key = falKey();
  const headers = { Authorization: `Key ${key}`, "content-type": "application/json" };
  const body = { prompt: CLIPS[name], duration: "10", aspect_ratio: "16:9", negative_prompt: NEGATIVE, cfg_scale: 0.5 };
  const sub = await (await fetch(`https://queue.fal.run/${MODEL}`, { method: "POST", headers, body: JSON.stringify(body) })).json();
  if (!sub.status_url) throw Error(`${name}: fal refused: ${JSON.stringify(sub).slice(0, 300)}`);
  for (;;) {
    await new Promise((r) => setTimeout(r, 8000));
    const st = await (await fetch(sub.status_url, { headers })).json();
    if (st.status === "COMPLETED") break;
    if (!["IN_QUEUE", "IN_PROGRESS"].includes(st.status)) throw Error(`${name}: ${JSON.stringify(st).slice(0, 300)}`);
  }
  const out = await (await fetch(sub.response_url, { headers })).json();
  const url = out.video?.url;
  if (!url) throw Error(`${name}: no video in ${JSON.stringify(out).slice(0, 300)}`);
  mkdirSync(raw, { recursive: true });
  writeFileSync(join(raw, `${name}.mp4`), Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log(`${name}: ${MODEL}, 10 s, $0.70 (0.07/s)`);
}

const GRADE = {
  auras: "eq=contrast=1.12:brightness=-0.03:saturation=1.3",
  record: "eq=contrast=1.35:brightness=-0.07:saturation=1.3,colorbalance=rm=0.14:gm=-0.04:bm=0.16:rh=0.08",
  rain: "eq=contrast=1.18:brightness=-0.07:saturation=1.3,colorbalance=rs=0.14:gs=-0.06:bs=-0.02:rm=0.1",
};

function encode(name) {
  const ff = process.env.FFMPEG ?? "ffmpeg";
  const src = join(raw, `${name}.mp4`);
  mkdirSync(media, { recursive: true });
  // The grade: blacks crushed toward the page's night, each clip pushed toward its section's light.
  // The loop: seconds 2-10, whose last two seconds dissolve into seconds 0-2, so the end meets the start.
  // 1280 wide at 24 fps is enough for a full-bleed loop under grain; the page adds its own grain on top.
  const fc = `[0:v]scale=1280:-2:flags=lanczos,fps=24,${GRADE[name]},split[a][b];[a]trim=2:10,setpts=PTS-STARTPTS,fps=24[x];[b]trim=0:2,setpts=PTS-STARTPTS,fps=24[y];[x][y]xfade=transition=fade:duration=2:offset=6,format=yuv420p[v]`;
  const vf = ["-filter_complex", fc, "-map", "[v]"];
  execFileSync(ff, ["-y", "-loglevel", "error", "-i", src, "-an", ...vf, "-c:v", "libaom-av1", "-crf", "36", "-b:v", "0", "-cpu-used", "6", "-row-mt", "1", "-movflags", "+faststart", join(media, `${name}.av1.mp4`)]);
  execFileSync(ff, ["-y", "-loglevel", "error", "-i", src, "-an", ...vf, "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-profile:v", "high", "-movflags", "+faststart", join(media, `${name}.h264.mp4`)]);
  // The poster is the loop's first frame, so the swap from still to motion shows no jump.
  execFileSync(ff, ["-y", "-loglevel", "error", "-i", join(media, `${name}.h264.mp4`), "-frames:v", "1", "-q:v", "4", join(media, `${name}.jpg`)]);
  for (const f of [`${name}.av1.mp4`, `${name}.h264.mp4`, `${name}.jpg`]) console.log(`${f}: ${(statSync(join(media, f)).size / 1e6).toFixed(2)} MB`);
}

const [cmd, ...names] = process.argv.slice(2);
const list = names.length ? names : Object.keys(CLIPS);
if (cmd === "generate") await Promise.all(list.map(generate));
else if (cmd === "encode") list.forEach(encode);
else { console.error("usage: media.mjs generate|encode [name…]"); process.exit(2); }
