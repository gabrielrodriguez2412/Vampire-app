import { useState, useMemo } from 'react';
import { clans } from '@/data/clans';
import { disciplines } from '@/data/disciplines';
import { rules } from '@/data/rules';
import { glossary } from '@/data/glossary';

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: 'clan' | 'disciplina' | 'regla' | 'glosario';
  url: string;
};

export function useSearch(query: string) {
  return useMemo(() => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search Clans
    clans.forEach(clan => {
      if (clan.name.toLowerCase().includes(lowerQuery) || clan.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: clan.id,
          title: clan.name,
          description: clan.identity,
          type: 'clan',
          url: `/clanes?id=${clan.id}`
        });
      }
    });

    // Search Disciplines
    disciplines.forEach(disc => {
      if (disc.name.toLowerCase().includes(lowerQuery) || disc.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: disc.id,
          title: disc.name,
          description: disc.type,
          type: 'disciplina',
          url: `/disciplinas?id=${disc.id}`
        });
      }
    });

    // Search Rules
    rules.forEach(rule => {
      if (rule.title.toLowerCase().includes(lowerQuery) || rule.shortExplanation.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: rule.id,
          title: rule.title,
          description: rule.shortExplanation,
          type: 'regla',
          url: `/reglas?id=${rule.id}`
        });
      }
    });

    // Search Glossary
    glossary.forEach(term => {
      if (term.term.toLowerCase().includes(lowerQuery) || term.definition.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: term.id,
          title: term.term,
          description: term.definition.substring(0, 60) + '...',
          type: 'glosario',
          url: `/glosario?id=${term.id}`
        });
      }
    });

    return results;
  }, [query]);
}