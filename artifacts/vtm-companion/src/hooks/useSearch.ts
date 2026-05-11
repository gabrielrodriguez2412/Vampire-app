import { useState, useMemo } from 'react';
import { clans } from '@/data/clans';
import { disciplines } from '@/data/disciplines';
import { rules } from '@/data/rules';
import { glossary } from '@/data/glossary';
import { useAppContext } from '@/context/AppContext';
import { getText, filterByEdition } from '@/utils/content';

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: 'clan' | 'disciplina' | 'regla' | 'glosario';
  url: string;
};

export function useSearch(query: string) {
  const { activeLanguage: lang, activeEdition: edition } = useAppContext();

  return useMemo(() => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    const filteredClans = clans.filter(c => c.editionAvailability.includes(edition));
    filteredClans.forEach(clan => {
      let name = getText(clan.name, lang) || '';
      if (clan.alternateNames?.[edition]) {
        const altName = getText(clan.alternateNames[edition] as any, lang);
        if (altName) name = altName;
      }
      
      const desc = getText(clan.summary, lang) || '';
      if (name.toLowerCase().includes(lowerQuery) || desc.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: clan.id,
          title: name,
          description: getText(clan.sect, lang) || "Unknown Sect",
          type: 'clan',
          url: `/compendium/clanes/${clan.id}`
        });
      }
    });

    const filteredDiscs = filterByEdition(disciplines, edition);
    filteredDiscs.forEach(disc => {
      const name = disc.name; // name is string
      const desc = getText(disc.description, lang) || '';
      if (name.toLowerCase().includes(lowerQuery) || desc.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: disc.id,
          title: name,
          description: getText(disc.type, lang) || '',
          type: 'disciplina',
          url: `/disciplinas?id=${disc.id}`
        });
      }
    });

    const filteredRules = filterByEdition(rules, edition);
    filteredRules.forEach(rule => {
      const title = getText(rule.title, lang) || '';
      const desc = getText(rule.shortExplanation, lang) || '';
      if (title.toLowerCase().includes(lowerQuery) || desc.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: rule.id,
          title,
          description: desc,
          type: 'regla',
          url: `/reglas?id=${rule.id}`
        });
      }
    });

    glossary.forEach(term => {
      const t = getText(term.term, lang) || '';
      const d = getText(term.definition, lang) || '';
      if (t.toLowerCase().includes(lowerQuery) || d.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: term.id,
          title: t,
          description: d.length > 60 ? d.substring(0, 60) + '...' : d,
          type: 'glosario',
          url: `/glosario?id=${term.id}`
        });
      }
    });

    return results;
  }, [query, lang, edition]);
}
