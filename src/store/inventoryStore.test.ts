import { describe, it, expect, beforeEach } from 'vitest'
import { useInventoryStore } from './inventoryStore'
import type { DestinyItem } from '../types/bungie.types'

const resetState = () =>
    useInventoryStore.setState({
        items: null,
        vaultItems: null,
        characterInventory: null,
        itemInstances: null,
        itemStats: null,
        itemSockets: null,
        itemPlugObjectives: null,
        isLoading: false,
        error: null,
    })

const mockItem: DestinyItem = {
    itemHash: 12345,
    itemInstanceId: 'inst-1',
    quantity: 1,
    bucketHash: 953998645,
    state: 0,
}

describe('inventoryStore', () => {
    beforeEach(resetState)

    it('starts with null data and isLoading false', () => {
        const state = useInventoryStore.getState()
        expect(state.items).toBeNull()
        expect(state.vaultItems).toBeNull()
        expect(state.isLoading).toBe(false)
        expect(state.error).toBeNull()
    })

    it('setLoading toggles isLoading', () => {
        useInventoryStore.getState().setLoading(true)
        expect(useInventoryStore.getState().isLoading).toBe(true)
        useInventoryStore.getState().setLoading(false)
        expect(useInventoryStore.getState().isLoading).toBe(false)
    })

    it('setError stores and clears an error message', () => {
        useInventoryStore.getState().setError('Failed to fetch inventory')
        expect(useInventoryStore.getState().error).toBe('Failed to fetch inventory')
        useInventoryStore.getState().setError(null)
        expect(useInventoryStore.getState().error).toBeNull()
    })

    it('setItems stores equipped items keyed by character ID', () => {
        const mockItems: Record<string, DestinyItem[]> = { 'char-1': [mockItem] }
        useInventoryStore.getState().setItems(mockItems)
        expect(useInventoryStore.getState().items).toEqual(mockItems)
    })

    it('setVaultItems stores vault items array', () => {
        const mockVaultItems: DestinyItem[] = [{ ...mockItem, itemInstanceId: 'inst-vault' }]
        useInventoryStore.getState().setVaultItems(mockVaultItems)
        expect(useInventoryStore.getState().vaultItems).toEqual(mockVaultItems)
    })

    it('setCharacterInventory stores non-equipped character items', () => {
        const mockInv: Record<string, DestinyItem[]> = { 'char-1': [mockItem] }
        useInventoryStore.getState().setCharacterInventory(mockInv)
        expect(useInventoryStore.getState().characterInventory).toEqual(mockInv)
    })

    it('setItems null clears items back to null', () => {
        useInventoryStore.getState().setItems({ 'char-1': [mockItem] })
        useInventoryStore.getState().setItems(null)
        expect(useInventoryStore.getState().items).toBeNull()
    })
})
