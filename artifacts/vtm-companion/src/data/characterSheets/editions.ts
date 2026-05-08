import { EditionId } from '../../types';
import { SheetSchema } from './schemas';
import { v5Schema } from './v5';
import { classicSchema } from './classic';

export function getSchemaForEdition(edition: EditionId): SheetSchema {
  if (edition === 'V5') return v5Schema;
  return classicSchema;
}
