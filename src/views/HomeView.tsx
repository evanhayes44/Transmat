import LoginButton from "../components/auth/LoginButton";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HomeView() {
    const { isAuthenticated } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (isAuthenticated) navigate("/inventory")
    }, [isAuthenticated, navigate])

    return (
        <div className="login-page">
            <div className="login-panel">
                <div className="login-logo">
                    <span className="login-logo-symbol">◈</span>
                    <span className="login-logo-text">TRANSMAT</span>
                </div>
                <p className="login-tagline">Destiny 2 Inventory Manager</p>
                <LoginButton />
            </div>
        </div>
    )
}