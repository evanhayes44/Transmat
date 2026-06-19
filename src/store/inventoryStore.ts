import { create } from "zustand"
import type {
    DestinyItem,
    InventoryState,
    DestinyItemInstance,
    DestinyItemStatBlock,
    DestinyItemSocketState,
    DestinyObjectiveProgress
} from "../types/bungie.types"

interface InventoryStore extends InventoryState {
    setItems: (items: Record<string, DestinyItem[]> | null) => void
    setVaultItems: (vaultItems: DestinyItem[] | null) => void
    setCharacterInventory: (characterInventory: Record<string, DestinyItem[]> | null) => void
    setItemInstances: (itemInstances: Record<string, DestinyItemInstance> | null) => void
    setItemStats: (itemStats: Record<string, { stats: Record<string, DestinyItemStatBlock> }> | null) => void
    setItemSockets: (itemSockets: Record<string, { sockets: DestinyItemSocketState[] }> | null) => void
    setItemPlugObjectives: (itemPlugObjectives: Record<string, { objectivesPerPlug: Record<string, DestinyObjectiveProgress[]> }> | null) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
}

export const useInventoryStore = create<InventoryStore>((set) => ({
    items: null,
    vaultItems: null,
    characterInventory: null,
    itemInstances: null,
    itemStats: null,
    itemSockets: null,
    itemPlugObjectives: null,
    isLoading: false,
    error: null,
    setItems: (items) => set({ items }),
    setVaultItems: (vaultItems) => set({ vaultItems }),
    setCharacterInventory: (characterInventory) => set({ characterInventory }),
    setItemInstances: (itemInstances) => set({ itemInstances }),
    setItemStats: (itemStats) => set({ itemStats }),
    setItemSockets: (itemSockets) => set({ itemSockets }),
    setItemPlugObjectives: (itemPlugObjectives) => set({ itemPlugObjectives }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}))