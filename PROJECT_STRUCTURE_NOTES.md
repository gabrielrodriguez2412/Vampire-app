# Vampire: The Masquerade Companion App - Structure Notes

This document clarifies the structure of the repository, how to run it locally, and where the frontend files are located. This was created to resolve confusion stemming from the original Replit structure and the monorepo architecture.

## 1. Project Structure
This repository is a **PNPM Workspace Monorepo**, containing multiple packages.

- **`artifacts/vtm-companion/`**: 🎯 **THIS IS THE REAL FRONTEND**. All the UI code, data, pages, and components you see when running the app live here.
- **`artifacts/api-server/`**: The backend API server.
- **`artifacts/mockup-sandbox/`**: A prototyping sandbox used for UI mockups. **Do not confuse this with the main app.** It contains a generic index.html that acts as a canvas previewer.
- **`lib/`**: Contains shared packages like database schemas, API specs, and Zod validators.
- **`package.json` (Root)**: The root config orchestrates the workspace but does not contain the frontend code.

## 2. Where is the Clan Data?
- **Data Source:** `artifacts/vtm-companion/src/data/clans.ts`
- **UI Component:** `artifacts/vtm-companion/src/pages/clans.tsx`
- **Types:** `artifacts/vtm-companion/src/types/index.ts`

There are **NO duplicate clan data files**. The issue previously experienced (where changes seemed invisible) was caused by a language fallback bug in the UI logic where Spanish ('es') was trying to render empty strings instead of defaulting to the updated English lore.

## 3. How to Run Locally Outside Replit
Because this is a pnpm monorepo, you need to use `pnpm` (not npm) to manage it.

1. Install dependencies from the root:
   ```bash
   pnpm install
   ```
2. Start the frontend development server:
   ```bash
   cd artifacts/vtm-companion
   pnpm run dev
   ```
   *(This will start a Vite server locally, usually on http://localhost:5173).*

3. To verify a production build:
   ```bash
   cd artifacts/vtm-companion
   pnpm run build
   pnpm run serve
   ```

## 4. How to Verify Clan/Edition Changes
1. Run the app locally as shown above and navigate to the **Clans** page (`/compendium/clanes`).
2. At the top of the page, there is now an explicit **Edition Selector** dropdown and a clan count indicator.
3. Select **V20**: You should see exactly **13** clans, using classic names (e.g., *Assamite*, *Followers of Set*).
4. Select **V5**: You should see exactly **16** clans. Notice that *Assamite* correctly renames to *Banu Haqim*, and clans like *Thin-Bloods* become available.
5. If your language is set to Spanish in settings, the app now safely falls back to English text rather than rendering blank cards.

## 5. Adding Bloodlines Later
To add minor bloodlines in the future:
1. Go to `artifacts/vtm-companion/src/data/clans.ts`.
2. Add a new `ClanEntry` object to the `clans` array.
3. Set `playableStatus` to `'bloodline'`.
4. Ensure `editionAvailability` correctly flags which editions they are valid for.
5. Provide a `.png` banner image in `artifacts/vtm-companion/public/images/`.

## 6. Deployment Workflow
This project uses **Railway** via Nixpacks, as defined in `nixpacks.toml` (for backend) and `nixpacks.frontend.toml` (for frontend), alongside the root `package.json`.

### Frontend Deployment
- **Build command:** `pnpm run railway:frontend:build` (delegates to `artifacts/vtm-companion`)
- **Start command:** `pnpm run railway:frontend:start`
- **Output Directory:** `artifacts/vtm-companion/dist`

### Backend Deployment
- **Build command:** `pnpm --filter @workspace/api-server run build`
- **Start command:** `pnpm --filter @workspace/api-server run start`
- **Health Endpoint:** The backend automatically binds to `0.0.0.0` and exposes a `GET /health` root endpoint. Railway requires this binding and a 200 OK response from the health endpoint to mark the deployment as successful.

## 7. Known Quirks and History
- **Edition IDs:** Earlier iterations of the codebase used lowercase strings like `"v1"`, `"v2"`, `"v5"`. These have all been migrated to strict uppercase constants (`"1ST"`, `"2ND"`, `"V5"`) to prevent magic string typos. A helper `normalizeEditionId` exists in `src/utils/content.ts` to ensure backwards compatibility with any old localStorage data.
