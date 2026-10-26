# VibeMatch

The site of VibeMatch, a company of CommandAGI: https://vibematch.commandagi.app

A static site. `site.json` names it; the pages are plain HTML. Serve the folder; there is nothing to build.

| path | what it is |
|---|---|
| `index.html` | the landing page: what VibeMatch is, how matching works, what we leave out |
| `about.html` | the score with its work shown, who runs the company, what the demo does with the answers |
| `app/` | the vibe check: the 18+ gate, sixteen signals, two dials, three sample matches, an intro for you, report and block |
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

## safety

The demo publishes nothing, but it is a dating product, so the family's safety rules have their shape here
before the first real member: an **18+ gate**, **report** and **block**, and the **moderation queue** the
reports go to. The about page says all of it in each locale (`about.html#safety`), and the landing pages say
18+ where they invite a visit.

- **The gate** is the first thing on the vibe check and nothing of the check is drawn behind it, so there is
  nothing to click past. "I am 18 or older" goes on; "I am not yet 18" shows a line and a link home. Nothing
  is recorded either way, and the next visit asks again (`app/app.js` `showGate`).
- **Report**, on every profile, opens a dialog with the platform's reasons (`spam`, `harassment`, `hate`,
  `sexual`, `violence`, `illegal`, `other`) and a note. The pages are served with `connect-src 'none'`, so the
  page cannot call anywhere: the dialog writes the report and hands it to the visitor's own mail app as a
  `mailto:hello@vibematch.dev` link (`app/safety.js` `reportMailto`). Nothing is sent until they send it.
- **Block** hides that person from the matches in this tab, and the page lists them with "Unblock". A block is
  state in the tab, not a setting or a file: nothing is stored past the tab (`app/safety.js`
  `visibleMatches`).
- **The moderation queue** is the platform's one queue (`docs/moderation.md` § the queue in CommandAGI): a
  report to `hello@vibematch.dev` opens a case the reviewers read (`GET /trust-safety/cases`), a person decides
  it, and the about page promises the 24-hour review the terms promise. We have zero tolerance for
  objectionable content and abusive members, and an urgent report also goes to the local emergency number.

## check

```
node --test tests/site.test.mjs      # the files, the three locales, the links, the score, the safety shape
node tests/journey.mjs               # the browser flow, serving this folder
```

The browser journey opens the landing page from a blank visit, refuses the gate once and passes it, takes the
check through the visible controls to three matches, reads the report the dialog writes, blocks a person and
unblocks them, and opens each locale. `--url https://vibematch.commandagi.app` runs it against the deployed
address.
