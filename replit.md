# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### vtm-companion (Vampiro: La Mascarada Companion)
- **Path**: `artifacts/vtm-companion/`
- **Stack**: React + Vite + TypeScript + Wouter + Framer Motion + shadcn/ui
- **Route**: `/` (preview)
- **Purpose**: Spanish-first VtM tabletop RPG companion — gothic digital grimoire

#### Features
- **Multilingual**: ES/EN/PT/FR/DE/IT — all UI text via `src/i18n/ui.ts` (UI_STRINGS)
- **Multi-edition**: V1/V2/Revised/V20/V5 — `filterByEdition()` used throughout
- **No backend**: Pure frontend, localStorage for all user state
- **Strict language isolation**: `getText()` returns `null` for missing translations — never silently falls back to English

#### Navigation Structure
- **Home** (`/`) — dashboard with quick-access cards
- **Compendium** (`/compendium`) — expandable hub (Clans, Disciplines, Rules, Roleplay, Tools, Glossary)
  - `/compendium/clanes`, `/compendium/disciplinas`, etc.
  - Legacy routes `/clanes`, `/disciplinas`, etc. still work
- **Character** (`/personaje`) — create/manage characters, character sheet, attributes
- **Chronicle** (`/cronica`) — session notes, NPCs, locations, timeline for Storytellers
- **Search** (`/buscar`) — global search across all content
- **Settings** (`/ajustes`) — language, edition, data management

#### Key Files
- `src/i18n/ui.ts` — ALL UI strings for 6 languages (never hardcode strings in pages)
- `src/utils/content.ts` — `getText()` (strict, no fallback), `getTextWithFallback()` (search only), `filterByEdition()`
- `src/context/AppContext.tsx` — global language + edition state (persisted to localStorage)
- `src/data/clans.ts` — 13 clans with multilang data
- `src/data/disciplines.ts` — 15 disciplines with multilang data
- `src/data/rules.ts` — 12+ rules with multilang data
- `src/data/glossary.ts` — 25+ glossary terms
- `src/types/index.ts` — ClanEntry, DisciplineEntry, RuleEntry, GlossaryEntry, Character

#### localStorage Keys
- `vtm-language` — active language code
- `vtm-edition` — active edition id
- `vtm-favorites` — set of favorited item IDs
- `vtm-notes` — array of note objects
- `vtm-characters` — array of Character objects
- `vtm-sessions`, `vtm-npcs`, `vtm-locations` — chronicle data

#### Data Rules
- When adding content, always provide `es` and `en` fields at minimum
- Use `fallbackStr()` only for items where content is truly language-neutral (proper nouns, etc.)
- `getText()` returns `null` if content is missing — pages must handle null gracefully with a "no translation" badge
