import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { refreshAccessToken, saveTokens, clearTokens } from '../services/auth'

export function useTokenRefresh() {
    const { login, setInitializing } = useAuthStore()

    useEffect(() => {
        async function tryRefresh() {
            useAuthStore.getState().initFromStorage()
            const { refreshToken, expiresAt } = useAuthStore.getState()

            if (!refreshToken) {
                setInitializing(false)
                return
            }

            const needsRefresh = !expiresAt || Date.now() > expiresAt - 5 * 60 * 1000
            if (!needsRefresh) {
                setInitializing(false)
                return
            }

            try {
                const tokens = await refreshAccessToken(refreshToken)
                saveTokens(tokens)
                login(
                    tokens.access_token,
                    tokens.refresh_token,
                    Date.now() + tokens.expires_in * 1000,
                    tokens.membership_id
                )
            } catch {
                clearTokens()
            } finally {
                setInitializing(false)
            }
        }

        tryRefresh()

        const interval = setInterval(tryRefresh, 30 * 60 * 1000)
        return () => clearInterval(interval)
    }, [login, setInitializing])
}
