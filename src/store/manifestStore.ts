import { create } from "zustand"
import type { ManifestState } from "../types/bungie.types"
import type { DestinyItemDefinition, DestinyRecordDefinition } from "../types/bungie.types"

interface ManifestStore extends ManifestState {
    setVersion: (version: string) => void
    setLoaded: (isLoaded: boolean) => void
    setError: (error: string | null) => void
    setData: (data: Record<string, DestinyItemDefinition>) => void
    setTitleData: (titleData: Record<string, DestinyRecordDefinition>) => void
}

export const useManifestStore = create<ManifestStore>((set) => ({
    version: null,
    isLoaded: false,
    error: null,
    data: null,
    titleData: null,
    setVersion: (version) => set({ version }),
    setLoaded: (isLoaded) => set({ isLoaded }),
    setError: (error) => set({ error }),
    setData: (data) => set({ data }),
    setTitleData: (titleData) => set({ titleData })
}))