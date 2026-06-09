import { Character, EditionId } from '../../types';
import { SheetSchema } from './schemas';
import { v5Schema } from './v5';
import { classicSchema } from './classic';
import { humanV5Schema, humanClassicSchema } from './human';
import { ghoulV5Schema, ghoulClassicSchema } from './ghoul';

/**
 * Edition-only selector kept for backward compatibility with the
 * pre-Batch-AY call sites and tests that don't know about `kind`. Always
 * returns a vampire schema — humans / ghouls must go through
 * `getSchemaForCharacter`.
 */
export function getSchemaForEdition(edition: EditionId): SheetSchema {
  if (edition === 'V5') return v5Schema;
  return classicSchema;
}

/**
 * Batch AY (Phase 2) — kind-and-edition-aware schema selector.
 *
 * Branches first on `character.kind`, then on `character.edition`. Missing
 * / unknown kind falls back to vampire so legacy saved characters keep
 * loading with the existing V5 / classic vampire schema unchanged. A
 * missing edition defaults to V5 to match the prior call site fallback.
 */
export function getSchemaForCharacter(character: Pick<Character, 'kind' | 'edition'>): SheetSchema {
  const edition: EditionId = character.edition ?? ('V5' as EditionId);
  const kind = character.kind ?? 'vampire';
  if (kind === 'human') {
    return edition === 'V5' ? humanV5Schema : humanClassicSchema;
  }
  if (kind === 'ghoul') {
    return edition === 'V5' ? ghoulV5Schema : ghoulClassicSchema;
  }
  // 'vampire' or any unrecognized value — fall through to the existing
  // vampire schemas. This is the byte-for-byte unchanged path.
  return getSchemaForEdition(edition);
}
