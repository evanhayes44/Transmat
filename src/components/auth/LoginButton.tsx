import { redirectToBungieLogin } from "../../services/auth";
import styles from "./LoginButton.module.css";

interface LoginButtonProps {
    className?: string
}

export default function LoginButton({ className }: LoginButtonProps) {
    return (
        <button className={`${styles.loginBtn}${className ? ` ${className}` : ''}`} onClick={() => redirectToBungieLogin()}>
            Connect with Bungie
        </button>
    )
}
