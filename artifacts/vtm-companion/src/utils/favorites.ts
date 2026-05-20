// Favorites helpers.
//
// The favorites store is a plain `{ [key: string]: true }` map persisted in
// localStorage under `vtm-favorites`. Existing callers (clans, disciplines,
// rules) write the raw content id as the key — those ids are stable and
// effectively pre-namespaced by data origin, so we don't change them to avoid
// invalidating user favorites.
//
// User-owned content (characters, chronicles) uses random UUIDs that could
// theoretically collide with future data ids, so we namespace those keys with
// a `type:` prefix via `makeFavoriteKey`. The `tool` type is reserved for a
// single static favorite (the Dice Tools page) and also uses the typed form.

export type FavoriteType =
  | 'clan'
  | 'discipline'
  | 'rule'
  | 'character'
  | 'chronicle'
  | 'tool';

/** Types stored with a `type:` prefix in the favorites map. */
const NAMESPACED_TYPES = new Set<FavoriteType>(['character', 'chronicle', 'tool']);

/**
 * Build the key under which a favorite is stored.
 *
 * - For clans / disciplines / rules we return the bare target id (backwards
 *   compatible with existing favorites in localStorage).
 * - For characters / chronicles / tools we return `${type}:${targetId}`.
 */
export function makeFavoriteKey(type: FavoriteType, targetId: string): string {
  if (!targetId) return '';
  if (NAMESPACED_TYPES.has(type)) return `${type}:${targetId}`;
  return targetId;
}

/**
 * Inverse of `makeFavoriteKey` for namespaced keys. Returns `null` for raw
 * (non-namespaced) keys — callers should match those against their own
 * content datasets to infer the type.
 */
export function parseFavoriteKey(key: string): { type: FavoriteType; targetId: string } | null {
  const idx = key.indexOf(':');
  if (idx <= 0) return null;
  const head = key.slice(0, idx);
  const tail = key.slice(idx + 1);
  if (!tail) return null;
  if (head === 'character' || head === 'chronicle' || head === 'tool') {
    return { type: head, targetId: tail };
  }
  return null;
}

/**
 * Lift a typed favorites map into structured buckets, resolving each entry
 * against the supplied datasets. Items whose target no longer exists are
 * dropped silently (e.g. a favorited character was deleted).
 *
 * Inputs are kept as plain `{id: string}` shaped arrays so callers can pass
 * whatever record types they have without coupling to specific interfaces.
 *
 * The result preserves the insertion order of the source arrays so the
 * Favorites page renders in the same order users see elsewhere.
 */
export interface ResolvableItem {
  id: string;
}

export interface ResolvedFavorites<C, D, R, Ch, Cr> {
  clans: C[];
  disciplines: D[];
  rules: R[];
  characters: Ch[];
  chronicles: Cr[];
  /** Total number of favorites that were successfully resolved. */
  total: number;
  /** Keys that point to nothing in the supplied datasets. */
  missingKeys: string[];
}

export function resolveFavoriteTargets<
  C extends ResolvableItem,
  D extends ResolvableItem,
  R extends ResolvableItem,
  Ch extends ResolvableItem,
  Cr extends ResolvableItem,
>(
  favorites: Record<string, boolean>,
  datasets: { clans: C[]; disciplines: D[]; rules: R[]; characters: Ch[]; chronicles: Cr[] },
): ResolvedFavorites<C, D, R, Ch, Cr> {
  const keys = Object.keys(favorites).filter(k => favorites[k]);
  const resolved: ResolvedFavorites<C, D, R, Ch, Cr> = {
    clans: [],
    disciplines: [],
    rules: [],
    characters: [],
    chronicles: [],
    total: 0,
    missingKeys: [],
  };

  // Bucket keys first so we can look them up against the right dataset only.
  const typed = new Map<FavoriteType, Set<string>>();
  const raw = new Set<string>();
  for (const key of keys) {
    const parsed = parseFavoriteKey(key);
    if (parsed) {
      const set = typed.get(parsed.type) ?? new Set<string>();
      set.add(parsed.targetId);
      typed.set(parsed.type, set);
    } else {
      raw.add(key);
    }
  }

  // Raw keys belong to clans, disciplines, or rules. Match in dataset order to
  // preserve the user-visible order on the Favorites page.
  for (const clan of datasets.clans) if (raw.has(clan.id)) { resolved.clans.push(clan); raw.delete(clan.id); }
  for (const disc of datasets.disciplines) if (raw.has(disc.id)) { resolved.disciplines.push(disc); raw.delete(disc.id); }
  for (const rule of datasets.rules) if (raw.has(rule.id)) { resolved.rules.push(rule); raw.delete(rule.id); }

  // Whatever's left raw is missing (likely stale data).
  for (const leftover of raw) resolved.missingKeys.push(leftover);

  const charIds = typed.get('character');
  if (charIds) {
    for (const ch of datasets.characters) if (charIds.has(ch.id)) { resolved.characters.push(ch); charIds.delete(ch.id); }
    for (const leftover of charIds) resolved.missingKeys.push(makeFavoriteKey('character', leftover));
  }

  const chrIds = typed.get('chronicle');
  if (chrIds) {
    for (const cr of datasets.chronicles) if (chrIds.has(cr.id)) { resolved.chronicles.push(cr); chrIds.delete(cr.id); }
    for (const leftover of chrIds) resolved.missingKeys.push(makeFavoriteKey('chronicle', leftover));
  }

  resolved.total =
    resolved.clans.length +
    resolved.disciplines.length +
    resolved.rules.length +
    resolved.characters.length +
    resolved.chronicles.length;

  return resolved;
}
