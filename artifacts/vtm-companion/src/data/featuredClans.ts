/**
 * Ordered list of clan ids featured on the home dashboard's "clan strip".
 *
 * IMPORTANT: every id here MUST exist in `clans.ts` as a canonical clan id.
 * An earlier version listed V5 alt-name slugs (`banu_haqim`, `hecata`,
 * `ministry`) which never matched anything in `clans.ts`, and three of the
 * thirteen featured clans silently disappeared from the strip. The
 * regression test in `__tests__/featuredClans.test.ts` locks this in.
 */
export const FEATURED_CLAN_IDS: readonly string[] = [
  "ventrue",
  "tremere",
  "brujah",
  "toreador",
  "nosferatu",
  "gangrel",
  "malkavian",
  "assamite",
  "giovanni",
  "lasombra",
  "followers_of_set",
  "ravnos",
  "salubri",
];
