import { clans } from "../data/clans";
import { disciplines } from "../data/disciplines";
import { rules } from "../data/rules";
import { glossary } from "../data/glossary";
import { EDITION_LIST } from "../data/editions";
import { LANGUAGES } from "../data/languages";

export function validateData(): string[] {
  const warnings: string[] = [];
  
  // Create sets for fast lookup
  const editionIds = new Set(EDITION_LIST.map(e => e.id));
  const langCodes = new Set(LANGUAGES.map(l => l.code));
  const disciplineIds = new Set(disciplines.map(d => d.id));
  const clanIds = new Set(clans.map(c => c.id));
  
  // Validate Clans
  clans.forEach(clan => {
    if (clan.editionAvailability.length === 0) warnings.push(`Clan ${clan.id} has no editions.`);
    clan.editionAvailability.forEach(ed => {
      if (!editionIds.has(ed)) warnings.push(`Clan ${clan.id} references unknown edition: ${ed}`);
    });
    clan.disciplines.forEach(d => {
      if (!disciplineIds.has(d)) warnings.push(`Clan ${clan.id} references unknown discipline: ${d}`);
    });
    if (!clan.name['en']) warnings.push(`Clan ${clan.id} is missing 'en' fallback for name`);
  });

  // Validate Disciplines
  disciplines.forEach(disc => {
    if (disc.editions.length === 0) warnings.push(`Discipline ${disc.id} has no editions.`);
    disc.editions.forEach(ed => {
      if (!editionIds.has(ed)) warnings.push(`Discipline ${disc.id} references unknown edition: ${ed}`);
    });
    disc.clansWhoUse.forEach(c => {
      if (!clanIds.has(c)) warnings.push(`Discipline ${disc.id} references unknown clan: ${c}`);
    });
    if (!disc.description['en']) warnings.push(`Discipline ${disc.id} is missing 'en' fallback for description`);
  });

  // Validate Rules
  rules.forEach(rule => {
    if (rule.editions.length === 0) warnings.push(`Rule ${rule.id} has no editions.`);
    if (!rule.title['en']) warnings.push(`Rule ${rule.id} is missing 'en' fallback for title`);
  });

  // Validate Glossary
  glossary.forEach(term => {
    if (!term.term['en']) warnings.push(`Glossary term ${term.id} is missing 'en' fallback for term`);
  });

  return warnings;
}
