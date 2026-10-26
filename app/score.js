// The score, in one place: what the about page says it is. 72% shared signals (Jaccard over the two
// boards) + 28% dial closeness (tempo and depth, each out of 100, averaged). Pure, so the site's test
// can hold the page to the words.
export function scoreOf(profile, me) {
  const mine = new Set(me.picks);
  const theirs = new Set(profile.picks);
  const shared = [...mine].filter((id) => theirs.has(id));
  const union = new Set([...mine, ...theirs]).size;
  const overlap = union ? shared.length / union : 0;
  const closeness = 1 - (Math.abs(me.tempo - profile.tempo) + Math.abs(me.depth - profile.depth)) / 200;
  return { score: Math.round(100 * (0.72 * overlap + 0.28 * closeness)), shared, overlap, closeness };
}

export function rankedMatches(profiles, me, count = 3) {
  return profiles
    .map((profile) => ({ profile, ...scoreOf(profile, me) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
