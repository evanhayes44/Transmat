import { useEffect } from "react";
import { bungieGet } from "../services/bungieApi";
import { useCharacterStore } from "../store/characterStore";
import { useInventoryStore } from "../store/inventoryStore";
import type { DestinyItem } from "../types/bungie.types";

export function useInventory(refreshKey?: number) {
    const { membershipType, destinyMembershipId } = useCharacterStore()
    const {
        setItems,
        setVaultItems,
        setCharacterInventory,
        setItemInstances,
        setItemStats,
        setItemSockets,
        setItemPlugObjectives,
        setLoading,
        setError } = useInventoryStore()

    useEffect(() => {
        if (!membershipType || !destinyMembershipId) return

        async function loadInventory() {
            setLoading(true)

            const isRefresh = (refreshKey ?? 0) > 0
            const components = isRefresh
                ? '102,201,205'
                : '205,102,201,300,304,305,309'

            try {
                const response = await bungieGet(`/Destiny2/${membershipType}/Profile/${destinyMembershipId}/?components=${components}`)

                const rawData = response.Response.characterEquipment.data as Record<string, { items: DestinyItem[] }>
                const items = Object.fromEntries(Object.entries(rawData).map(([characterId, value]) => [characterId, value.items]))

                const vaultData = response.Response.profileInventory.data.items as DestinyItem[]

                const rawInventory = response.Response.characterInventories.data as Record<string, { items: DestinyItem[] }>
                const characterInventory = Object.fromEntries(Object.entries(rawInventory).map(([characterId, value]) => [characterId, value.items]))

                setItems(items)
                setVaultItems(vaultData)
                setCharacterInventory(characterInventory)

                if (!isRefresh) {
                    const itemInstances = response.Response.itemComponents.instances.data
                    const itemStats = response.Response.itemComponents.stats.data
                    const itemSockets = response.Response.itemComponents.sockets.data
                    const itemPlugObjectives = response.Response.itemComponents.plugObjectives.data

                    setItemInstances(itemInstances)
                    setItemStats(itemStats)
                    setItemSockets(itemSockets)
                    setItemPlugObjectives(itemPlugObjectives)
                }

                setLoading(false)
            } catch {
                setError("Error loading inventory")
            }
        }

        loadInventory()

    }, [membershipType,
        destinyMembershipId,
        setItems,
        setVaultItems,
        setCharacterInventory,
        setItemInstances,
        setLoading,
        setItemStats,
        setItemSockets,
        setItemPlugObjectives,
        setError,
        refreshKey])
}