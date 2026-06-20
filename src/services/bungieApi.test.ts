import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bungieGet, bungiePost, transferItem, equipItem } from './bungieApi'

vi.mock('../store/authStore', () => ({
    useAuthStore: {
        getState: vi.fn(() => ({ accessToken: 'test-access-token' })),
    },
}))

describe('bungieApi', () => {
    let mockFetch: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mockFetch = vi.fn()
        global.fetch = mockFetch
        vi.stubEnv('VITE_BUNGIE_API_KEY', 'test-api-key')
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    describe('bungieGet', () => {
        it('calls the correct Bungie Platform URL', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({ Response: 'data' }) })
            await bungieGet('Destiny2/Profile/123/')
            expect(mockFetch).toHaveBeenCalledWith(
                'https://www.bungie.net/Platform/Destiny2/Profile/123/',
                expect.any(Object)
            )
        })

        it('sends Authorization and X-API-KEY headers', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
            await bungieGet('Destiny2/Profile/123/')
            const [, options] = mockFetch.mock.calls[0]
            expect(options.headers['Authorization']).toBe('Bearer test-access-token')
            expect(options.headers['X-API-KEY']).toBe('test-api-key')
        })

        it('returns the parsed JSON response', async () => {
            const payload = { Response: { characters: { data: {} } } }
            mockFetch.mockResolvedValue({ ok: true, json: async () => payload })
            const result = await bungieGet('Destiny2/Profile/123/')
            expect(result).toEqual(payload)
        })

        it('throws when response is not ok', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 401 })
            await expect(bungieGet('Destiny2/Profile/123/')).rejects.toThrow('Error fetching data: 401')
        })
    })

    describe('bungiePost', () => {
        it('calls the correct URL with POST method', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
            await bungiePost('Destiny2/Actions/Items/TransferItem/', {})
            expect(mockFetch).toHaveBeenCalledWith(
                'https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/',
                expect.objectContaining({ method: 'POST' })
            )
        })

        it('sends Content-Type application/json header', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
            await bungiePost('Destiny2/Actions/Items/TransferItem/', {})
            const [, options] = mockFetch.mock.calls[0]
            expect(options.headers['Content-Type']).toBe('application/json')
        })

        it('serialises the body to JSON', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
            const body = { itemId: 'abc', characterId: 'char-1', membershipType: 2 }
            await bungiePost('Destiny2/Actions/Items/TransferItem/', body)
            const [, options] = mockFetch.mock.calls[0]
            expect(options.body).toBe(JSON.stringify(body))
        })

        it('throws when response is not ok', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 500 })
            await expect(bungiePost('Destiny2/Actions/Items/EquipItem/', {})).rejects.toThrow('Bungie API error: 500')
        })
    })

    describe('transferItem', () => {
        it('posts to the TransferItem endpoint with correct payload', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
            await transferItem(12345, 'item-1', 'char-1', 2, false)
            const [url, options] = mockFetch.mock.calls[0]
            expect(url).toContain('TransferItem')
            expect(JSON.parse(options.body)).toEqual({
                itemReferenceHash: 12345,
                stackSize: 1,
                transferToVault: false,
                itemId: 'item-1',
                characterId: 'char-1',
                membershipType: 2,
            })
        })

        it('sets transferToVault true when moving to vault', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
            await transferItem(12345, 'item-1', 'char-1', 2, true)
            const [, options] = mockFetch.mock.calls[0]
            expect(JSON.parse(options.body).transferToVault).toBe(true)
        })
    })

    describe('equipItem', () => {
        it('posts to the EquipItem endpoint with correct payload', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
            await equipItem('item-1', 'char-1', 2)
            const [url, options] = mockFetch.mock.calls[0]
            expect(url).toContain('EquipItem')
            expect(JSON.parse(options.body)).toEqual({
                itemId: 'item-1',
                characterId: 'char-1',
                membershipType: 2,
            })
        })
    })
})
