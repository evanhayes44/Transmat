import { create } from "zustand"
import type { AuthState } from "../types/bungie.types"
import { clearTokens, loadTokensFromStorage } from "../services/auth"

interface AuthStore extends AuthState {
    login: (
        accessToken: string,
        refreshToken: string,
        expiresAt: number,
        membershipId: string
    ) => void
    logout: () => void
    initFromStorage: () => void
    isInitializing: boolean
    setInitializing: (value: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    membershipId: null,
    isAuthenticated: false,
    isInitializing: true,
    login: (
        accessToken,
        refreshToken,
        expiresAt,
        membershipId,
    ) => set({
        accessToken,
        refreshToken,
        expiresAt,
        membershipId,
        isAuthenticated: true,
    }),
    setInitializing: (value) => set({ isInitializing: value }),
    logout: () => {
        clearTokens()
        set({
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            membershipId: null,
            isAuthenticated: false,
        })
    },
    initFromStorage: () => set(loadTokensFromStorage())
}))