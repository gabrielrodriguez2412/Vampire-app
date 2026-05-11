import { Edition, EditionId } from '../types';

export const EDITIONS = {
  FIRST: "1ST",
  SECOND: "2ND",
  REVISED: "REVISED",
  V20: "V20",
  V5: "V5"
} as const;

export const EDITION_LIST: Edition[] = [
  { id: EDITIONS.FIRST, name: '1st Edition', shortName: '1ST', year: 1991 },
  { id: EDITIONS.SECOND, name: '2nd Edition', shortName: '2ND', year: 1992 },
  { id: EDITIONS.REVISED, name: 'Revised Edition', shortName: 'REVISED', year: 1998 },
  { id: EDITIONS.V20, name: '20th Anniversary Edition', shortName: 'V20', year: 2011 },
  { id: EDITIONS.V5, name: '5th Edition', shortName: 'V5', year: 2018 },
];
