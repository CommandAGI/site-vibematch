// The demo's safety shape: an 18+ gate (drawn by app.js), report and block.
//
// Nothing here sends and nothing is stored. A block is a list of profile ids in this tab's memory, and a
// report is a mailto: link the visitor's own mail app opens: the pages are served with connect-src 'none',
// so the page itself cannot call anywhere. A real report reaches a person through hello@vibematch.dev,
// which opens a case in CommandAGI's moderation queue (docs/moderation.md § report); the site's about page
// promises the 24-hour review the terms do.
export const REASONS = ["spam", "harassment", "hate", "sexual", "violence", "illegal", "other"];

/** The matches a person still sees: a block hides its profile from the list. */
export function visibleMatches(ranked, blocked = []) {
  return ranked.filter(({ profile }) => !blocked.includes(profile.id));
}

/**
 * The report a person sends from their own mail app. It names the sample profile, the reason and the note,
 * so the moderation queue receives a case it can read without the page.
 */
export function reportMailto({ profile, reason, reasonLabel, note = "", page = "https://vibematch.commandagi.app/app/" }) {
  if (!REASONS.includes(reason)) throw Error(`unknown report reason: ${reason}`);
  const subject = `Report of ${profile.name} (${profile.id}) in the VibeMatch demo`;
  const lines = [
    `Profile: ${profile.name} (${profile.id}), a fictional sample profile in the demo`,
    `Reason: ${reasonLabel ?? reason}`,
    note.trim() ? `Note: ${note.trim()}` : null,
    `Page: ${page}`,
    "",
    "A person reviews every report within 24 hours. VibeMatch has zero tolerance for objectionable content and abusive members.",
  ].filter((line) => line !== null);
  return `mailto:hello@vibematch.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
