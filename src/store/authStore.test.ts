import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import { saveTokens } from '../services/auth'
import type { BungieTokenResponse } from '../types/bungie.types'

const mockTokens: BungieTokenResponse = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    membership_id: 'test-membership-id',
    token_type: 'Bearer',
    refresh_expires_in: 7776000,
}

const resetState = () =>
    useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        membershipId: null,
        isAuthenticated: false,
        isInitializing: true,
    })

describe('authStore', () => {
    beforeEach(() => {
        resetState()
        localStorage.clear()
    })

    it('starts with unauthenticated state', () => {
        const state = useAuthStore.getState()
        expect(state.isAuthenticated).toBe(false)
        expect(state.accessToken).toBeNull()
    })

    it('login sets all auth fields and isAuthenticated true', () => {
        useAuthStore.getState().login('access-123', 'refresh-123', 9999999, 'member-123')
        const state = useAuthStore.getState()
        expect(state.accessToken).toBe('access-123')
        expect(state.refreshToken).toBe('refresh-123')
        expect(state.expiresAt).toBe(9999999)
        expect(state.membershipId).toBe('member-123')
        expect(state.isAuthenticated).toBe(true)
    })

    it('logout clears auth state', () => {
        useAuthStore.getState().login('access-123', 'refresh-123', 9999999, 'member-123')
        useAuthStore.getState().logout()
        const state = useAuthStore.getState()
        expect(state.accessToken).toBeNull()
        expect(state.refreshToken).toBeNull()
        expect(state.expiresAt).toBeNull()
        expect(state.membershipId).toBeNull()
        expect(state.isAuthenticated).toBe(false)
    })

    it('setInitializing updates isInitializing', () => {
        expect(useAuthStore.getState().isInitializing).toBe(true)
        useAuthStore.getState().setInitializing(false)
        expect(useAuthStore.getState().isInitializing).toBe(false)
    })

    it('initFromStorage loads tokens saved to localStorage', () => {
        saveTokens(mockTokens)
        useAuthStore.getState().initFromStorage()
        const state = useAuthStore.getState()
        expect(state.accessToken).toBe('test-access-token')
        expect(state.refreshToken).toBe('test-refresh-token')
        expect(state.membershipId).toBe('test-membership-id')
        expect(state.isAuthenticated).toBe(true)
    })

    it('initFromStorage sets isAuthenticated false when storage is empty', () => {
        useAuthStore.getState().initFromStorage()
        expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
})
