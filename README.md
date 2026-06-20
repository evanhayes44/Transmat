# Transmat

A Destiny 2 inventory manager built with React, TypeScript, and Vite. Browse your characters' equipped gear and vault, filter and sort weapons and armor, inspect item details, and transfer or equip items directly from the browser.

## Features

### Inventory View
- Displays all three characters side-by-side with emblem background, class name, title, and light level
- Shows equipped item for each gear slot alongside the character's inventory queue (up to 9 items per slot)
- Full vault display organized by gear category (Kinetic, Energy, Power, Helmet, Gauntlets, Chest, Legs, Class Item, Misc)

### Item Identifiers
Every item in the inventory and vault displays:
- **Tier pips** — five diamond icons (◆) filled based on the item's tier (Uncommon → Legendary → Exotic)
- **Masterwork glow** — gold border effect when the item has been masterworked (bit flag `state & 4`)
- **Power level** — displayed in the corner of the item icon
- **Hover tooltip** — item name appears on mouse-over

### Item Modal
Click any item to open a detail modal showing:
- Item icon, name, and flavor text — if a cosmetic ornament is equipped, the icon automatically updates to show the ornament's appearance
- All stats with bar visualizations
- Socket perks with icon, name, and descriptions
- Catalyst / intrinsic objectives with progress bars
- **Masterwork badge** — masterworked weapons display the masterwork icon, the stat that was masterworked (e.g. `◆ BLAST RADIUS`), and all stat bonuses granted by the masterwork (e.g. `+3 Stability  +3 Handling`)
- Character inventory slots showing where the item can be transferred — each slot item uses the same tier pip, masterwork, and power identifiers as the main inventory
- Transfer and Equip buttons for each character, plus a Move to Vault option

### Transfer and Equip
- **Transfer** — moves an item from its current location (character or vault) to a target character or the vault, using the Bungie API `TransferItem` endpoint
- **Equip** — equips an item on a character using the `EquipItem` endpoint
- Loading state shown on the active button during the request
- Lightweight re-fetch after each action: only inventory components are re-fetched (not stats, sockets, or perks) so the UI updates quickly without a full reload

### Vault Filtering and Sorting
- **Search** — filter by item name
- **Sort** — Power descending, Power ascending, or Name A–Z
- **Element filter** — filter by damage type (Kinetic, Arc, Solar, Void, Stasis, Strand)
- **Champion filter** — filter for Unstoppable, Overload, or Barrier champion mods
- **Exotic toggle** — show only exotic items
- **Masterwork toggle** — show only masterworked items
- **Weapon type chips** — quick filter by weapon archetype (Auto Rifle, Hand Cannon, Pulse Rifle, etc.)
- Reset button clears all active filters

### Login Screen
- Branded login page with the TRANSMAT logo and tagline
- Single "Connect with Bungie" button that redirects to the Bungie OAuth authorization page
- After authentication, automatically redirects to the inventory view
- If already logged in, the login page redirects immediately to inventory

### Live Inventory Updates
The inventory polls the Bungie API every 30 seconds in the background. New drops, loot from activities, transfers made from another device, and other in-game changes appear automatically without a manual page refresh. The interval is started when the inventory view mounts and cleaned up when it unmounts, so no requests are made when the page is not active.

### Persistent Login
- Access token is stored in `localStorage` and restored on page load
- On startup, tokens are loaded from storage before the refresh check runs — if the access token has expired but the refresh token is still valid (up to 90 days), a silent refresh happens before the app renders so the user is never sent back to the login screen unexpectedly
- A background refresh also runs every 30 minutes to proactively replace tokens before they expire
- Logging out clears all stored tokens

## Security

### PKCE (Proof Key for Code Exchange)
Transmat uses PKCE for OAuth 2.0 authentication. This is the standard for browser-based apps because it removes the need for a client secret (which cannot be safely stored in a browser).

How it works:
1. Before redirecting to Bungie, the app generates a random **code verifier** (32 random bytes, base64url-encoded)
2. The verifier is SHA-256 hashed to produce a **code challenge**
3. The challenge is sent with the authorization request; the verifier is stored in `sessionStorage`
4. When Bungie redirects back with an authorization code, the app sends the code **and the original verifier** to the token endpoint
5. Bungie hashes the verifier and confirms it matches the challenge from step 2 — proving the token request came from the same session that started the login

This means even if the authorization code is intercepted, it cannot be exchanged for tokens without the verifier.

### CSRF Protection
A random `state` parameter is generated and stored in `sessionStorage` before the redirect. The callback view verifies that the `state` returned by Bungie matches before proceeding. This prevents cross-site request forgery attacks on the OAuth flow.

## Testing

The project uses [Vitest](https://vitest.dev/) as the test runner and [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) for component tests, with jsdom simulating the browser environment.

### What's covered

| File | What it tests |
|---|---|
| `src/services/auth.test.ts` | `saveTokens`, `loadTokensFromStorage`, `clearTokens` — localStorage read/write and expiry logic |
| `src/services/bungieApi.test.ts` | `bungieGet` / `bungiePost` with a mocked `fetch` — correct URL construction, auth headers, JSON body serialisation, error throwing on non-ok responses; `transferItem` and `equipItem` payload shapes |
| `src/store/authStore.test.ts` | `login`, `logout`, `setInitializing`, `initFromStorage` — state transitions and localStorage integration |
| `src/store/inventoryStore.test.ts` | All setters (`setLoading`, `setError`, `setItems`, `setVaultItems`, `setCharacterInventory`) — state updates and null-clearing |
| `src/components/auth/LoginButton.test.tsx` | Renders the label, calls `redirectToBungieLogin` on click, applies extra className prop |
| `src/components/ItemModal.test.tsx` | Null-guard when `itemDef` is undefined, item name and sub-type rendering, power level, close button, backdrop click, Vault destination |
| `src/views/HomeView.test.tsx` | Logo, tagline, login button, and logo symbol all render |
| `src/views/InventoryView.test.tsx` | Page layout, Logout button calling `logout()`, sort dropdown, search input, Exotic/Masterwork filter toggles, Reset button clearing all filters, weapon type chips toggling, loading skeleton panels, character class name and power level, item modal open/close |

### Running tests

```bash
npm test          # watch mode (re-runs on file save, for development)
npm run test:run  # single run and exit (used in CI)
```

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 |
| Language | TypeScript 6 |
| Build | Vite 8 |
| Routing | React Router DOM 7 |
| Global state | Zustand 5 |
| Manifest cache | IndexedDB via `idb` |
| Auth | OAuth 2.0 + PKCE (Bungie API) |

## Project Structure

```
src/
├── components/
│   ├── ItemModal.tsx          # Item detail modal with transfer/equip
│   └── auth/
│       └── LoginButton.tsx    # Bungie OAuth login button
├── hooks/
│   ├── useCharacters.ts       # Fetches character data from Bungie API
│   ├── useInventory.ts        # Fetches equipped items, inventory, and vault
│   ├── useManifest.ts         # Loads and caches the Destiny manifest
│   └── useTokenRefresh.ts     # Silently refreshes the access token on a timer
├── services/
│   ├── auth.ts                # PKCE flow, token exchange, refresh, storage
│   ├── bungieApi.ts           # Authenticated GET and POST wrappers
│   └── manifest.ts            # Manifest download and IndexedDB caching
├── store/
│   ├── authStore.ts           # Auth state (token, membership ID, isInitializing)
│   ├── characterStore.ts      # Character list and membership type
│   ├── inventoryStore.ts      # Items, instances, stats, sockets, vault
│   └── manifestStore.ts       # Item definitions and title records
├── types/
│   └── bungie.types.ts        # TypeScript types for all Bungie API shapes
└── views/
    ├── AuthCallbackView.tsx   # Handles the OAuth redirect, exchanges code for tokens
    ├── HomeView.tsx           # Login screen
    └── InventoryView.tsx      # Main inventory UI with filters and item grid
```

## Setup

### Prerequisites
- Node.js 18+
- A Bungie application registered at [bungie.net/developer](https://www.bungie.net/en/Application)
  - Set the application type to **Public** (required for PKCE — no client secret)
  - Add your redirect URI (e.g. `https://localhost:5173/auth/callback`)

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_BUNGIE_API_KEY=your_api_key_here
VITE_BUNGIE_CLIENT_ID=your_client_id_here
VITE_REDIRECT_URI=https://localhost:5173/auth/callback
```

> Note: The redirect URI must use HTTPS. The dev server runs with SSL via `@vitejs/plugin-basic-ssl`.

### Install and Run

```bash
npm install
npm run dev
```

Open `https://localhost:5173` in your browser (accept the self-signed certificate warning), then click **Connect with Bungie** to log in.

### Build for Production

```bash
npm run build
```

Output is in the `dist/` directory.

## CI/CD Pipeline

### Continuous Integration (GitHub Actions)

Every push to `master` and every pull request automatically runs a CI workflow defined in `.github/workflows/ci.yml`. It spins up a fresh Linux environment, installs dependencies, and runs:

1. **Lint** — ESLint checks for code quality issues
2. **Test** — Vitest runs all 75+ tests across stores, services, and components
3. **Build** — TypeScript type checking + Vite production build

If either step fails, GitHub marks the commit with a red X and the failure is visible in the **Actions** tab of the repo. This catches broken code before it reaches the live site.

The build step requires your environment variables to be present. These are stored as **GitHub Secrets** (`Settings → Secrets and variables → Actions`) so they are never exposed in the workflow file:
- `VITE_BUNGIE_API_KEY`
- `VITE_BUNGIE_CLIENT_ID`
- `VITE_REDIRECT_URI`

### Continuous Deployment (Vercel)

The app is hosted on [Vercel](https://vercel.com). Vercel watches the `master` branch and automatically deploys on every push — no manual steps required. Environment variables are configured separately in the Vercel dashboard so the production build has access to them at build time.

The full flow on every push to `master`:
```
Push to master
  → GitHub Actions runs lint + tests + build (CI)
  → Vercel detects the push and deploys to production (CD)
  → Live site updates automatically
```

## How the Manifest Works

The Destiny 2 manifest is a large database of item definitions, perk descriptions, stat names, and more. Transmat downloads it on first load and caches it in IndexedDB so it doesn't need to be re-downloaded on every visit. When Bungie publishes an update, the manifest version changes and the cache is automatically invalidated and refreshed.

## API Endpoints Used

| Purpose | Endpoint |
|---|---|
| Get characters | `GET /Destiny2/{membershipType}/Profile/{membershipId}/?components=200` |
| Get inventory | `GET /Destiny2/{membershipType}/Profile/{membershipId}/?components=102,201,205,300,304,305,309` |
| Transfer item | `POST /Destiny2/Actions/Items/TransferItem/` |
| Equip item | `POST /Destiny2/Actions/Items/EquipItem/` |
| Manifest info | `GET /Destiny2/Manifest/` |
| Token exchange | `POST /platform/app/oauth/token/` |
