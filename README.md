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
- Item icon, name, and flavor text
- All stats with bar visualizations
- Socket perks with icon, name, and descriptions
- Catalyst / intrinsic objectives with progress bars
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

### Persistent Login
- Access token is stored in `localStorage` and restored on page load
- A background refresh runs every 30 minutes using the refresh token to silently re-authenticate
- On startup, if the access token is expired but a refresh token exists, a refresh is attempted before rendering — so the user never sees a login flash
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
│   ├── ItemTooltip.tsx        # Reusable tooltip component
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
