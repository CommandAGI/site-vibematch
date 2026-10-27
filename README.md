# VibeMatch

The site of VibeMatch, a company of CommandAGI: https://vibematch.commandagi.app

A static site. `site.json` names it; the pages are plain HTML. Serve the folder; there is nothing to build.
The 2027 design (dark, after hours: auras, film grain, Syne and Atkinson Hyperlegible Next) is specified in
`redesign/DESIGN.md`; the audit is `redesign/CONTENT.md`; the generated media, its prompts and its cost are in
`redesign/NOTES.md`.

| path | what it is |
|---|---|
| `index.html` | the landing page: the hero loop, the aura mixer (`home.js`), how matching works, the door policy, the score, early access |
| `about.html` | the score with its work shown, who runs the company, what the demo does with the answers |
| `app/` | the vibe check: sixteen signals, two dials, three sample matches, an intro written for you |
| `style.css` | the site's stylesheet (dark only) |
| `app/aura.js` | an aura drawn from answers (canvas), and the page's motion switch |
| `media/` | three generated loops (AV1 + H.264) and their posters |
| `fonts/` | Syne and Atkinson Hyperlegible Next, subset woff2, with their OFL licences |
| `wordmark.svg`, `mark.svg`, `touch-icon.png`, `og.png` | the identity |
| `redesign/` | the audit, the design, the notes and the scripts that made the media and the identity |
| `es/`, `zh-Hans/` | the same three pages in Spanish and Simplified Chinese |

## locales

Every page exists in **en** (`/`), **es** (`/es/`) and **zh-Hans** (`/zh-Hans/`). Each page declares its
`lang`, its `hreflang` alternates, and carries the A/文 picker in the footer, which links to the same page
in the other two locales. The vibe check's strings live in `app/app.js`'s `M` table, one entry per locale;
the signals and sample profiles carry their own labels per locale in `app/vibes.js` and `app/profiles.js`.

## the demo

`app/app.js` computes the score in the page: **72% shared-signal overlap (Jaccard) + 28% dial closeness**,
rounded. The eight profiles in `app/profiles.js` are fictional, are drawn in code (`app/avatar.js`), and
are marked *sample* wherever they appear. The pages are served with `connect-src 'none'`: the demo cannot
call anywhere, and nothing is stored past the tab.

## check

```
node --test tests/site.test.mjs      # the files, the three locales, the links, the score, the loops
node tests/journey.mjs               # the browser journey: the aura mixer, the vibe check, the locales
```

The browser journey against the deployed address is `docs/site-check.md`'s command in this repository's
parent task: open https://vibematch.commandagi.app from a blank visit, take the check, reach three matches.
