import { describe, it, expect, beforeEach } from 'vitest'
import { saveTokens, loadTokensFromStorage, clearTokens } from './auth.ts'
import type { BungieTokenResponse } from '../types/bungie.types.ts'

const mockTokens: BungieTokenResponse = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    membership_id: 'test-membership-id',
    token_type: 'Bearer',
    refresh_expires_in: 7776000,
}

describe('Auth Token Storage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('saveTokens writes all values to localStorage', () => {
        saveTokens(mockTokens)

        expect(localStorage.getItem('accessToken')).toBe('test-access-token')
        expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token')
        expect(localStorage.getItem('membershipId')).toBe('test-membership-id')
        expect(localStorage.getItem('expiresAt')).not.toBeNull()
    })

    it('loadTokensFromStorage returns the saved values', () => {
        saveTokens(mockTokens)
        const state = loadTokensFromStorage()

        expect(state.accessToken).toBe('test-access-token')
        expect(state.refreshToken).toBe('test-refresh-token')
        expect(state.membershipId).toBe('test-membership-id')
        expect(state.isAuthenticated).toBe(true)
    })

    it('loadTokensFromStorage returns isAuthenticated false when storage is empty', () => {
        const state = loadTokensFromStorage()

        expect(state.isAuthenticated).toBe(false)
    })

    it('clearTokens removes all values from localStorage', () => {
        saveTokens(mockTokens)
        clearTokens()

        expect(localStorage.getItem('accessToken')).toBeNull()
        expect(localStorage.getItem('refreshToken')).toBeNull()
        expect(localStorage.getItem('membershipId')).toBeNull()
        expect(localStorage.getItem('expiresAt')).toBeNull()
    })
})