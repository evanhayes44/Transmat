import type { AuthState, BungieTokenResponse } from "../types/bungie.types"

function base64UrlEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

function generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return base64UrlEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return base64UrlEncode(new Uint8Array(hash))
}

export async function redirectToBungieLogin() {
    const clientId = import.meta.env.VITE_BUNGIE_CLIENT_ID as string

    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateCodeVerifier()

    sessionStorage.setItem('pkce_verifier', verifier)
    sessionStorage.setItem('oauth_state', state)

    window.location.href = `https://www.bungie.net/en/oauth/authorize?client_id=${clientId}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`
}

export async function exchangeCodeForTokens(code: string): Promise<BungieTokenResponse> {
    const clientId = import.meta.env.VITE_BUNGIE_CLIENT_ID as string
    const redirectUri = import.meta.env.VITE_REDIRECT_URI as string
    const verifier = sessionStorage.getItem('pkce_verifier') ?? ''

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: verifier,
    })

    sessionStorage.removeItem('pkce_verifier')
    sessionStorage.removeItem('oauth_state')

    const response = await fetch("https://www.bungie.net/platform/app/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
    })
    if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`)
    return await response.json() as BungieTokenResponse
}

export async function refreshAccessToken(refreshToken: string): Promise<BungieTokenResponse> {
    const clientId = import.meta.env.VITE_BUNGIE_CLIENT_ID as string

    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
    })

    const response = await fetch("https://www.bungie.net/platform/app/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
    })
    if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`)
    return await response.json() as BungieTokenResponse
}

export function saveTokens(tokens: BungieTokenResponse) {
    const expiresAt = Date.now() + (tokens.expires_in * 1000)
    localStorage.setItem("accessToken", tokens.access_token)
    localStorage.setItem("refreshToken", tokens.refresh_token)
    localStorage.setItem("membershipId", tokens.membership_id)
    localStorage.setItem("expiresAt", expiresAt.toString())
}

export function loadTokensFromStorage(): AuthState {
    const raw = localStorage.getItem("expiresAt")
    const loadAccessToken = localStorage.getItem("accessToken")
    const loadRefreshToken = localStorage.getItem("refreshToken")
    const loadMembershipId = localStorage.getItem("membershipId")
    const loadExpiresAt = raw ? Number(raw) : null
    const isAuthenticated = !!loadAccessToken && !!loadExpiresAt && Date.now() < loadExpiresAt

    return {
        accessToken: loadAccessToken,
        refreshToken: loadRefreshToken,
        expiresAt: loadExpiresAt,
        membershipId: loadMembershipId,
        isAuthenticated
    } as AuthState
}

export function clearTokens() {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("membershipId")
    localStorage.removeItem("expiresAt")
}
