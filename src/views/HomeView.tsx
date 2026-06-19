import LoginButton from "../components/auth/LoginButton";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomeView.module.css";

export default function HomeView() {
    const { isAuthenticated } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (isAuthenticated) navigate("/inventory")
    }, [isAuthenticated, navigate])

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginPanel}>
                <div className={styles.loginLogo}>
                    <span className={styles.loginLogoSymbol}>◈</span>
                    <span className={styles.loginLogoText}>TRANSMAT</span>
                </div>
                <p className={styles.loginTagline}>Destiny 2 Inventory Manager</p>
                <LoginButton />
            </div>
        </div>
    )
}
