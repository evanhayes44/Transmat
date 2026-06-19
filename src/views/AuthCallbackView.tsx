import { exchangeCodeForTokens, saveTokens } from "../services/auth";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function AuthCallback() {
    const { login } = useAuthStore()
    const navigate = useNavigate()

    const hasFetched = useRef(false)

    useEffect(() => {

        if (hasFetched.current) return
        hasFetched.current = true

        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")

        const returnedState = params.get("state")
        const savedState = sessionStorage.getItem('oauth_state')

        if (!code || returnedState !== savedState) {
            navigate("/")
            return
        }

        exchangeCodeForTokens(code).then((tokens) => {
            saveTokens(tokens)
            const expiresAt = Date.now() + (tokens.expires_in * 1000)
            login(tokens.access_token, tokens.refresh_token, expiresAt, tokens.membership_id)
            navigate("/")
        })
            .catch((err) => {
                console.error(err)
                navigate("/")
            })
    }, [login, navigate])

    return <p>Logging in...</p>
}