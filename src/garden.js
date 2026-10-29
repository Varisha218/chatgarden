export const SPECIES = ['rose', 'sunflower', 'tulip', 'daisy', 'lavender', 'tropical'];

export function hashSpecies(username) {
  let hash = 2166136261;
  for (const char of username.toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return SPECIES[(hash >>> 0) % SPECIES.length];
}

export function chooseSpecies(username, emotes = {}) {
  const totals = new Map();
  for (const [emote, positions] of Object.entries(emotes ?? {})) {
    const count = Array.isArray(positions) ? positions.reduce((sum, group) => sum + String(group).split(',').length, 0) : 0;
    if (count) totals.set(emote, (totals.get(emote) ?? 0) + count);
  }
  if (!totals.size) return hashSpecies(username);
  const winner = [...totals].sort(([a, ac], [b, bc]) => bc - ac || a.localeCompare(b))[0][0];
  let hash = 0;
  for (const char of winner) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return SPECIES[(hash >>> 0) % SPECIES.length];
}

export function growthStage(waterings = 0) {
  if (waterings >= 30) return 'bloom';
  if (waterings >= 10) return 'bud';
  if (waterings >= 3) return 'sprout';
  return 'seed';
}

export function detectSpike(timestamps, now = Date.now(), windowMs = 30_000, multiplier = 2) {
  const recent = timestamps.filter(t => t > now - windowMs && t <= now).length;
  const historical = timestamps.filter(t => t <= now - windowMs).length;
  const elapsed = timestamps.length ? Math.max(windowMs, now - Math.min(...timestamps)) : windowMs;
  const average = historical / Math.max(1, (elapsed - windowMs) / windowMs);
  return { spike: recent >= 5 && average > 0 && recent > average * multiplier, recent, average };
}
