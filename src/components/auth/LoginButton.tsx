import { redirectToBungieLogin } from "../../services/auth";

interface LoginButtonProps {
    className?: string
}

export default function LoginButton({ className }: LoginButtonProps) {
    return (
        <button className={`login-btn${className ? ` ${className}` : ''}`} onClick={() => redirectToBungieLogin()}>
            Connect with Bungie
        </button>
    )
}
