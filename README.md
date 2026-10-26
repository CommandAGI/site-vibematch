# VibeMatch

The site of VibeMatch, a company of CommandAGI: https://vibematch.commandagi.app

A static site. `site.json` names it; the pages are plain HTML. Serve the folder; there is nothing to build.

| path | what it is |
|---|---|
| `index.html` | the landing page: what VibeMatch is, how matching works, what we leave out |
| `about.html` | the score with its work shown, who runs the company, what the demo does with the answers |
| `app/` | the vibe check: sixteen signals, two dials, three sample matches, an intro written for you |
| `style.css` | the site's stylesheet (light and dark from the person's setting) |
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
node --test tests/site.test.mjs      # the files, the three locales, the links, the score
```

The browser journey against the deployed address is `docs/site-check.md`'s command in this repository's
parent task: open https://vibematch.commandagi.app from a blank visit, take the check, reach three matches.
