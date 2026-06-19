# Transmat — Project Notes

## Stack
- React 18 + TypeScript + Vite (https://localhost:5173, @vitejs/plugin-basic-ssl)
- Zustand for state management
- React Router
- idb for IndexedDB
- fetch for Bungie API calls

## Completed

### Auth
- Full OAuth2 flow with Bungie API
- Tokens stored in localStorage
- `authStore` holds `accessToken`, `refreshToken`, `membershipId`, `isAuthenticated`
- `initFromStorage()` called in `App.tsx` on mount to restore session

### Characters
- `useCharacters` fetches memberships then profile (component 200)
- `membershipType` and `destinyMembershipId` stored in `characterStore` for reuse by other hooks
- `CharacterPanel` displays class name + power level

### Manifest
- `getManifest()` in `manifest.ts` fetches `DestinyInventoryItemDefinition` from Bungie
- Cached in IndexedDB (`d2-manifest` database, `manifest` object store) with version key
- Cache hit skips download; version mismatch triggers fresh download
- `useManifest` guards on `isAuthenticated`, stores `data` + `version` in `manifestStore`
- `useManifest` called in `App.tsx` so manifest loads on app start

### Inventory
- `useInventory` fetches equipped items (component 205) once `membershipType` + `destinyMembershipId` are available
- Items stored in `inventoryStore` as `Record<string, DestinyItem[]>` (characterId → items)
- `InventoryView` looks up each `itemHash` in `manifestStore.data` to display item names
- `CLASS_NAMES` constant moved to `bungie.types.ts` and shared across components

### Styling
- Sci-fi theme in `index.css` — void black bg, dark navy panels, electric cyan accent
- Character header: emblem banner background, dark gradient overlay, class name left + power level right
- Item list: dark cards with cyan left-border accent on hover
- `DestinyItemDefinition` interface typed with `displayProperties.name` + `icon`

## Known Issues / Future Work
- `getManifest()` calls Bungie API before checking cache — expired token prevents cache use
- `useCharacters` race condition: fires before `membershipId` is restored from localStorage (resolves on re-render, minor)
- Item icons displayed as 64x64 grid, hover tooltip shows item name
- Triumph titles shown in character header (gold italic, beneath class name). Fetched via `DestinyRecordDefinition` manifest component, keyed by `titleRecordHash`, gender-aware via `titlesByGender`
- Vault items (component 102) in progress — `vaultItems: DestinyItem[] | null` being added to `InventoryState` and `inventoryStore`. Next: add `setVaultItems` to store, fetch component 102 in `useInventory`, display in `InventoryView` as a separate panel below characters
- No error recovery UI (e.g. retry button)
- `CharacterPanel` component unused — can be removed or repurposed

## Key File Map
```
src/
├── types/bungie.types.ts         — all shared interfaces
├── services/auth.ts              — OAuth2 helpers
├── services/bungieApi.ts         — bungieGet() with auth header
├── services/manifest.ts          — IndexedDB cache + manifest fetch
├── store/authStore.ts
├── store/characterStore.ts       — includes membershipType + destinyMembershipId
├── store/manifestStore.ts        — includes full manifest data
├── store/inventoryStore.ts
├── hooks/useCharacters.ts
├── hooks/useManifest.ts
├── hooks/useInventory.ts
├── components/inventory/CharacterPanel.tsx
├── views/HomeView.tsx            — shows login, redirects if authed
├── views/AuthCallbackView.tsx
├── views/InventoryView.tsx       — main view, calls all hooks
└── App.tsx                       — mounts useManifest, initFromStorage
```
